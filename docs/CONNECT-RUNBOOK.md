# Stripe Connect — Activation Runbook

Implements **D028**. The code is complete and typechecks; this runbook is the
founder-gated activation path. BidSpace is a **destination-charge marketplace**:
the vendor pays the platform, Stripe transfers the payout to the host's
connected account minus a 10% application fee (D018).

## Architecture (already built — do not re-decide)

| Concern | Choice | Where |
|---|---|---|
| Connected account | **Controller properties** (Express-equivalent), not legacy `type:"express"` | `apps/web/lib/stripe.ts` → `createConnectOnboardingLink` |
| Onboarding | Stripe-hosted Account Links (`account_onboarding`) | same |
| Capability requested | `transfers` | same |
| Fees payer | `application` (platform) | controller config |
| Loss liability | `application` (platform) | controller config |
| Charge | Hosted Checkout, `payment_intent_data.application_fee_amount` + `transfer_data.destination` | `createBookingCheckoutSession` |
| Settlement | signature-verified, idempotent webhook | `apps/web/app/api/stripe/webhook/route.ts` |
| Fee math | 10% (`DEFAULT_PLATFORM_FEE_BPS = 1000`) | `packages/core/src/money.ts` |

The connected account is created with:
```ts
stripe.accounts.create({
  controller: {
    stripe_dashboard: { type: "express" },
    fees: { payer: "application" },
    losses: { payments: "application" },
  },
  capabilities: { transfers: { requested: true } },
  business_profile: { name },
  email,
})
```

## Founder activation steps

1. **Enable Connect** on the BidSpace Stripe account: dashboard → Connect → Get
   started. Complete the **platform profile** (this is where you acknowledge
   platform liability for negative balances — required because
   `losses.payments = application`).
2. **Platform business verification / KYC** — company details, EIN, beneficial
   owners, bank account for platform payouts. *(This is the unavoidable founder
   step; nothing technical blocks on it.)*
3. Copy the **API keys** (use **test mode** first): `Secret key` → Doppler
   `bidspace/prd` as `STRIPE_SECRET_KEY` (and a separate test value in
   `bidspace/dev`).
4. **Webhook endpoint**: dashboard → Developers → Webhooks → Add endpoint →
   `https://<production-host>/api/stripe/webhook`. Subscribe to exactly:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
   Copy the **Signing secret** → Doppler as `STRIPE_WEBHOOK_SECRET`.
5. Redeploy so the app picks up the keys.

## Prove the external money loop (canonical proof)

Do this in **test mode** first (Stripe test cards, no real money):

1. Sign in as a **host** → `/host/settings` → **Connect payouts with Stripe** →
   complete Stripe-hosted onboarding with test data. Confirm the page then shows
   *Charges: Enabled / Payouts: Enabled* (from `getConnectAccountStatus`).
2. Sign in as a **vendor** → bid on an open unit → host awards it (`/host/bids`
   → **Award & request payment**) → vendor opens the booking → **Pay** → Stripe
   Checkout → pay with `4242 4242 4242 4242`.
3. Verify: the webhook flips the booking to `confirmed`, the bid to `booked`,
   the unit to `booked`; the payment row is `paid` with
   `platform_fee_cents = round(amount * 0.10)` and
   `host_payout_cents = amount - fee`.
4. Confirm in the Stripe dashboard: the PaymentIntent shows the application fee
   on the platform and the transfer to the connected account.

The internal state machine + fee split is already proven end-to-end against the
live database by `tools/live-loop-check.ts` ($280 → $28 fee → $252 payout).
This step proves the same path with **real Stripe money movement** attached.

## Go-live switch

After the test-mode loop passes, swap `STRIPE_SECRET_KEY` /
`STRIPE_WEBHOOK_SECRET` in `bidspace/prd` for **live-mode** values and repeat
step 1–4 once with a real card + real connected account (a small real charge you
refund). Only then is the money loop production-proven.
