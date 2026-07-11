import type { BidspaceClient, PaymentRow } from "@bidspace/db";
import {
  type PaymentStatus,
  paymentStatusTransitions,
  canTransition,
  platformFeeCents,
  hostPayoutCents,
  DEFAULT_PLATFORM_FEE_BPS,
} from "@bidspace/core";
import { NotFoundError, TransitionError, ValidationError, fromDbError } from "./errors";
import { getBooking } from "./booking";

// --- Money split (D018: 10% platform commission; D020: integer cents) ---
export interface PaymentSplit {
  amountCents: number;
  platformFeeCents: number;
  hostPayoutCents: number;
  feeBps: number;
}

export function splitPayment(
  amountCents: number,
  feeBps: number = DEFAULT_PLATFORM_FEE_BPS,
): PaymentSplit {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new ValidationError("Payment amount must be a positive integer number of cents");
  }
  return {
    amountCents,
    platformFeeCents: platformFeeCents(amountCents, feeBps),
    hostPayoutCents: hostPayoutCents(amountCents, feeBps),
    feeBps,
  };
}

// --- Stripe Connect destination charge (D021 integration spine) ---
// Pure builder for the parameters a Stripe adapter passes to
// stripe.paymentIntents.create. Encodes the Connect "destination charge" model:
// the platform collects an application fee and routes the remainder to the
// host's connected account. Kept SDK-free so the money rules are unit-testable
// without secrets or network access.
export interface ConnectChargeParams {
  amount: number;
  currency: string;
  application_fee_amount: number;
  transfer_data: { destination: string };
  metadata: Record<string, string>;
}

export interface BuildConnectChargeInput {
  amountCents: number;
  currency?: string;
  hostStripeAccountId: string;
  feeBps?: number;
  metadata?: Record<string, string>;
}

export function buildConnectChargeParams(input: BuildConnectChargeInput): ConnectChargeParams {
  if (!input.hostStripeAccountId) {
    throw new ValidationError("hostStripeAccountId is required for a Connect destination charge");
  }
  const split = splitPayment(input.amountCents, input.feeBps);
  return {
    amount: split.amountCents,
    currency: (input.currency ?? "usd").toLowerCase(),
    application_fee_amount: split.platformFeeCents,
    transfer_data: { destination: input.hostStripeAccountId },
    metadata: input.metadata ?? {},
  };
}

// Port for the payment provider. A Stripe adapter (in apps/web or a worker)
// implements this; the service layer depends only on the interface.
export interface PaymentGateway {
  createDestinationCharge(params: ConnectChargeParams): Promise<{ id: string; status: string }>;
}

export interface InitiateBookingPaymentInput {
  bookingId: string;
  currency?: string;
  hostStripeAccountId?: string;
  feeBps?: number;
  gateway?: PaymentGateway;
}

// Creates the payment record for a booking that is awaiting payment, computing
// the platform fee / host payout split. If a gateway + connected account are
// supplied, a Stripe destination charge is opened and its intent id is stored.
export async function initiateBookingPayment(
  db: BidspaceClient,
  input: InitiateBookingPaymentInput,
): Promise<PaymentRow> {
  const booking = await getBooking(db, input.bookingId);
  if (booking.status !== "pending_payment") {
    throw new ValidationError(`Booking is not awaiting payment (status: ${booking.status})`);
  }
  const split = splitPayment(booking.price_cents, input.feeBps);

  let stripePaymentIntentId: string | null = null;
  if (input.gateway && input.hostStripeAccountId) {
    const charge = await input.gateway.createDestinationCharge(
      buildConnectChargeParams({
        amountCents: booking.price_cents,
        currency: input.currency,
        hostStripeAccountId: input.hostStripeAccountId,
        feeBps: input.feeBps,
        metadata: { booking_id: booking.id, bid_id: booking.bid_id },
      }),
    );
    stripePaymentIntentId = charge.id;
  }

  const { data, error } = await db
    .from("payments")
    .insert({
      booking_id: booking.id,
      payer_organization_id: booking.bidder_organization_id,
      payee_organization_id: booking.host_organization_id,
      amount_cents: split.amountCents,
      currency: (input.currency ?? "USD").toUpperCase(),
      platform_fee_cents: split.platformFeeCents,
      host_payout_cents: split.hostPayoutCents,
      stripe_payment_intent_id: stripePaymentIntentId,
      status: "pending" satisfies PaymentStatus,
    })
    .select("*")
    .single();
  if (error) throw fromDbError("initiateBookingPayment", error);
  return data as PaymentRow;
}

export async function getPayment(db: BidspaceClient, id: string): Promise<PaymentRow> {
  const { data, error } = await db.from("payments").select("*").eq("id", id).maybeSingle();
  if (error) throw fromDbError("getPayment", error);
  if (!data) throw new NotFoundError("payment", id);
  return data as PaymentRow;
}

// Look up the payment behind a Stripe PaymentIntent (set during settlement).
// Used by refund/dispute webhook handlers to map a Stripe event back to the
// marketplace record. Returns null when no payment matches (e.g. an intent from
// a different platform product).
export async function findPaymentByStripeIntent(
  db: BidspaceClient,
  stripePaymentIntentId: string,
): Promise<PaymentRow | null> {
  const { data, error } = await db
    .from("payments")
    .select("*")
    .eq("stripe_payment_intent_id", stripePaymentIntentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw fromDbError("findPaymentByStripeIntent", error);
  return (data as PaymentRow | null) ?? null;
}

// Pure: decide the refund payment status from the charge total vs the amount
// refunded so far. Full refund → `refunded`; a non-zero partial →
// `partially_refunded`. Kept DB-free so it is unit-testable.
export function classifyRefund(
  amountCents: number,
  amountRefundedCents: number,
): "refunded" | "partially_refunded" | null {
  if (!Number.isFinite(amountRefundedCents) || amountRefundedCents <= 0) return null;
  return amountRefundedCents >= amountCents ? "refunded" : "partially_refunded";
}

// Pure: map a closed Stripe dispute's status to the resolved payment status.
//   won            → `paid_out`  (platform retained the funds; payout proceeds)
//   lost           → `refunded`  (chargeback succeeded; funds returned to buyer)
//   warning_closed → null        (an early warning cleared; no money moved)
//   anything else  → null        (still open / not a terminal outcome)
// The booking's operational outcome stays a human/admin decision; the webhook
// only records the unambiguous money fact (plus cancelling on a definitive loss).
export function classifyDisputeClose(
  disputeStatus: string,
): "paid_out" | "refunded" | null {
  if (disputeStatus === "won") return "paid_out";
  if (disputeStatus === "lost") return "refunded";
  return null;
}

// Records a payment status change (e.g. from a Stripe webhook), guarded by the
// canonical payment state machine.
export async function recordPaymentResult(
  db: BidspaceClient,
  id: string,
  to: PaymentStatus,
  patch: Record<string, unknown> = {},
): Promise<PaymentRow> {
  const current = await getPayment(db, id);
  if (!canTransition(paymentStatusTransitions, current.status, to)) {
    throw new TransitionError(`Illegal payment transition: ${current.status} -> ${to}`);
  }
  const { data, error } = await db
    .from("payments")
    .update({ status: to, ...patch })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw fromDbError("recordPaymentResult", error);
  return data as PaymentRow;
}
