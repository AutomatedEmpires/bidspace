import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import {
  ServiceError,
  TransitionError,
  classifyRefund,
  classifyDisputeClose,
  findPaymentByStripeIntent,
  recordPaymentResult,
  settleBookingPayment,
  transitionBooking,
  transitionInventoryUnit,
  getBooking,
} from "@bidspace/services";
import type { PaymentRow } from "@bidspace/db";
import { getStripe, isStripeEnabled } from "@/lib/stripe";
import { tryGetDb } from "@/lib/safe-db";
import { captureServerEvent } from "@/lib/analytics-server";

export const dynamic = "force-dynamic";

// Stripe → BidSpace settlement path. Verified signature, idempotent by event
// id (stripe_webhook_events PK), state machines guard every transition.
export async function POST(request: NextRequest) {
  if (!isStripeEnabled() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }
  const db = tryGetDb();
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const payload = await request.text();
    event = getStripe().webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency, done safely: a ledger row means the event was FULLY processed.
  // We record it only AFTER handling succeeds (see below), never before — so a
  // crash or DB hiccup mid-settlement cannot strand a paid booking. Every
  // handler is itself idempotent (state-machine guards + status-filtered
  // queries), so a Stripe retry re-runs harmlessly until it succeeds.
  const seen = await db
    .from("stripe_webhook_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();
  if (seen.error) {
    return NextResponse.json({ error: "Ledger read failed" }, { status: 500 });
  }
  if (seen.data) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    await handleStripeEvent(db, event);
  } catch (error) {
    // A genuine failure (DB down, unexpected error). Do NOT record the event as
    // processed and return non-2xx so Stripe retries with backoff. ServiceError
    // from a guarded transition on a truly stuck state is rare; retrying is the
    // safe default — the alternative (silently 200) loses the settlement.
    const detail = error instanceof ServiceError ? error.message : "handler error";
    return NextResponse.json({ error: detail }, { status: 500 });
  }

  // Success: record the event so future retries short-circuit. A concurrent
  // duplicate delivery may have inserted it first (23505) — that is fine.
  const recorded = await db
    .from("stripe_webhook_events")
    .insert({ id: event.id, event_type: event.type });
  if (recorded.error && recorded.error.code !== "23505") {
    // Handling already applied; failing to record only risks a harmless,
    // idempotent reprocess on the next retry. Acknowledge success.
    return NextResponse.json({ received: true, ledger: "deferred" });
  }

  return NextResponse.json({ received: true });
}

// Applies one Stripe event to marketplace state. Idempotent: status-filtered
// queries + state-machine guards make re-execution a no-op once applied, so it
// is safe to call again on a Stripe retry.
async function handleStripeEvent(
  db: NonNullable<ReturnType<typeof tryGetDb>>,
  event: Stripe.Event,
): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const bookingId = session.metadata?.booking_id;
      if (!bookingId) return;

      const paymentResult = await db
        .from("payments")
        .select("*")
        .eq("booking_id", bookingId)
        .in("status", ["pending", "authorized"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (paymentResult.error) throw paymentResult.error;
      const payment = paymentResult.data as PaymentRow | null;
      if (payment) {
        await recordPaymentResult(db, payment.id, "paid", {
          stripe_payment_intent_id:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : payment.stripe_payment_intent_id,
        });
      }

      const booking = await getBooking(db, bookingId);
      if (booking.status === "pending_payment") {
        await settleBookingPayment(db, bookingId);
        captureServerEvent("booking_paid", booking.bidder_organization_id, {
          booking_id: booking.id,
          price_cents: booking.price_cents,
        });
        // Advance the unit to booked along whichever legal path it is on. Unit
        // state is advisory; the booking + payment are the authoritative record,
        // so an illegal unit transition never fails the settlement.
        try {
          await transitionInventoryUnit(db, booking.inventory_unit_id, "booked");
        } catch (error) {
          if (error instanceof TransitionError) {
            try {
              await transitionInventoryUnit(db, booking.inventory_unit_id, "payment_pending");
              await transitionInventoryUnit(db, booking.inventory_unit_id, "booked");
            } catch {
              // Best-effort only.
            }
          } else {
            throw error;
          }
        }
      }
      return;
    }
    case "checkout.session.expired":
    case "payment_intent.payment_failed": {
      const object = event.data.object as { metadata?: Record<string, string> };
      const bookingId = object.metadata?.booking_id;
      if (!bookingId) return;
      const paymentResult = await db
        .from("payments")
        .select("*")
        .eq("booking_id", bookingId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (paymentResult.error) throw paymentResult.error;
      const payment = paymentResult.data as PaymentRow | null;
      if (payment) {
        await recordPaymentResult(db, payment.id, "failed", {
          failure_reason: event.type,
        });
      }
      return;
    }
    case "charge.refunded": {
      // A settled charge was refunded (full or partial). Map back to the
      // payment via its PaymentIntent, record the refund, and cancel the
      // booking on a full refund where the lifecycle still allows it.
      const charge = event.data.object as {
        payment_intent?: string | { id: string } | null;
        amount?: number;
        amount_refunded?: number;
      };
      const intentId =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : (charge.payment_intent?.id ?? null);
      if (!intentId) return;
      const payment = await findPaymentByStripeIntent(db, intentId);
      if (!payment) return;
      const to = classifyRefund(charge.amount ?? payment.amount_cents, charge.amount_refunded ?? 0);
      if (!to) return;
      try {
        await recordPaymentResult(db, payment.id, to, {
          refund_cents: charge.amount_refunded ?? null,
        });
      } catch (error) {
        if (!(error instanceof TransitionError)) throw error;
        if (payment.status !== to) throw error;

        // Stripe can emit multiple partial-refund snapshots. The lifecycle
        // state is unchanged, but the cumulative amount must still advance.
        const { error: refundUpdateError } = await db
          .from("payments")
          .update({ refund_cents: charge.amount_refunded ?? null })
          .eq("id", payment.id);
        if (refundUpdateError) throw refundUpdateError;
      }
      if (to === "refunded") {
        // Best-effort: a fully-refunded booking is cancelled when its stage
        // still permits it (pre-operation). in_progress/completed bookings keep
        // their state — the refund is recorded but the engagement happened.
        try {
          const booking = await getBooking(db, payment.booking_id);
          await transitionBooking(db, booking.id, "cancelled");
        } catch (error) {
          if (!(error instanceof ServiceError)) throw error;
        }
      }
      return;
    }
    case "charge.dispute.created": {
      // A chargeback was opened. Flag the payment + booking as disputed so the
      // admin dispute queue surfaces it; resolution is a human/admin action.
      const dispute = event.data.object as { payment_intent?: string | { id: string } | null };
      const intentId =
        typeof dispute.payment_intent === "string"
          ? dispute.payment_intent
          : (dispute.payment_intent?.id ?? null);
      if (!intentId) return;
      const payment = await findPaymentByStripeIntent(db, intentId);
      if (!payment) return;
      try {
        await recordPaymentResult(db, payment.id, "disputed");
      } catch (error) {
        if (!(error instanceof TransitionError)) throw error;
      }
      try {
        const booking = await getBooking(db, payment.booking_id);
        await transitionBooking(db, booking.id, "disputed");
      } catch (error) {
        if (!(error instanceof ServiceError)) throw error;
      }
      return;
    }
    case "charge.dispute.closed": {
      // The chargeback resolved. Record the money fact (won → funds retained,
      // lost → refunded to the buyer). A lost dispute cancels the booking (the
      // engagement is void); a won dispute leaves the booking for admin to
      // resolve operationally via the disputes queue.
      const dispute = event.data.object as {
        payment_intent?: string | { id: string } | null;
        status?: string;
      };
      const outcome = classifyDisputeClose(dispute.status ?? "");
      if (!outcome) return;
      const intentId =
        typeof dispute.payment_intent === "string"
          ? dispute.payment_intent
          : (dispute.payment_intent?.id ?? null);
      if (!intentId) return;
      const payment = await findPaymentByStripeIntent(db, intentId);
      if (!payment) return;
      try {
        await recordPaymentResult(
          db,
          payment.id,
          outcome,
          outcome === "refunded" ? { refund_cents: payment.amount_cents } : {},
        );
      } catch (error) {
        if (!(error instanceof TransitionError)) throw error;
      }
      if (outcome === "refunded") {
        try {
          const booking = await getBooking(db, payment.booking_id);
          await transitionBooking(db, booking.id, "cancelled");
        } catch (error) {
          if (!(error instanceof ServiceError)) throw error;
        }
      }
      return;
    }
    default:
      return;
  }
}
