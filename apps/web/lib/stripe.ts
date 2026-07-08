import "server-only";
import Stripe from "stripe";
import type { PaymentGateway, ConnectChargeParams } from "@bidspace/services";

// Stripe Connect wiring (D021). Every entry point is env-gated: without
// STRIPE_SECRET_KEY the marketplace runs with payments honestly disabled —
// no fake payment state, ever.

export function isStripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY (and STRIPE_WEBHOOK_SECRET) via Doppler or apps/web/.env.local.",
    );
  }
  if (!cached) {
    // apiVersion is left to the SDK's pinned default (stripe@18.5.0) so the
    // generated types match the wire version. appInfo lets Stripe attribute
    // platform API traffic — a Connect best practice.
    cached = new Stripe(key, {
      appInfo: { name: "BidSpace", url: "https://bidspace.app" },
    });
  }
  return cached;
}

// Adapter for the service-layer PaymentGateway port: opens a Connect
// destination charge PaymentIntent (platform fee + host transfer).
export function createStripeGateway(): PaymentGateway {
  const stripe = getStripe();
  return {
    async createDestinationCharge(params: ConnectChargeParams) {
      const intent = await stripe.paymentIntents.create({
        amount: params.amount,
        currency: params.currency,
        application_fee_amount: params.application_fee_amount,
        transfer_data: params.transfer_data,
        metadata: params.metadata,
        automatic_payment_methods: { enabled: true },
      });
      return { id: intent.id, status: intent.status };
    },
  };
}

// Hosted Checkout for a booking: the vendor pays, Stripe routes the payout to
// the host's connected account minus the platform fee.
export async function createBookingCheckoutSession(input: {
  bookingId: string;
  amountCents: number;
  applicationFeeCents: number;
  hostStripeAccountId: string;
  productName: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  return stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: input.amountCents,
          product_data: { name: input.productName },
        },
      },
    ],
    payment_intent_data: {
      application_fee_amount: input.applicationFeeCents,
      transfer_data: { destination: input.hostStripeAccountId },
      metadata: { booking_id: input.bookingId },
    },
    metadata: { booking_id: input.bookingId },
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
  });
}

// Stripe-hosted onboarding for host payout accounts.
//
// D028: connected accounts are created with controller properties, NOT the
// deprecated `type: "express"` account type. The controller config below is
// the Express-equivalent posture required by our destination-charge model:
//   - stripe_dashboard.type "express" → host gets the Express Dashboard
//   - fees.payer "application"        → the platform pays Stripe fees (required
//                                        for destination charges)
//   - losses.payments "application"   → the platform is liable for negative
//                                        balances (required for destination
//                                        charges; recommended by Stripe)
//   - requirement_collection defaults to "stripe" → Stripe-hosted KYC, so we
//                                        need not collect country up front.
// The `transfers` capability is what lets the platform route destination-charge
// funds into the connected account. `controller` and `type` are mutually
// exclusive — passing both is an API error, so `type` is intentionally absent.
export async function createConnectOnboardingLink(input: {
  existingAccountId: string | null;
  organizationName: string;
  email?: string;
  returnUrl: string;
  refreshUrl: string;
}): Promise<{ accountId: string; url: string }> {
  const stripe = getStripe();
  let accountId = input.existingAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({
      controller: {
        stripe_dashboard: { type: "express" },
        fees: { payer: "application" },
        losses: { payments: "application" },
      },
      capabilities: { transfers: { requested: true } },
      business_profile: { name: input.organizationName },
      email: input.email,
    });
    accountId = account.id;
  }
  const link = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    return_url: input.returnUrl,
    refresh_url: input.refreshUrl,
  });
  return { accountId, url: link.url };
}

export async function getConnectAccountStatus(accountId: string): Promise<{
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}> {
  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(accountId);
  return {
    chargesEnabled: Boolean(account.charges_enabled),
    payoutsEnabled: Boolean(account.payouts_enabled),
    detailsSubmitted: Boolean(account.details_submitted),
  };
}
