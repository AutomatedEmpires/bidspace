# Real-Money Proof Fixture

A production-safe, pre-designed operator procedure for the one controlled
external transaction that proves the money loop end to end. After Stripe KYC and
account access exist, this requires **no new design work** — follow it verbatim.

> Do **not** run real money without founder authorization. Run it in Stripe
> **test mode** first (test cards, no real funds); only then repeat once in live
> mode with a small real charge you refund.

## The fixture (already seeded in the live DB)

These rows exist in Supabase project `bidspace` (`hnjjcgxflxlfsqslgxcv`). The
internal loop is already proven against them by `tools/live-loop-check.ts`.

| Role | Entity | ID | Notes |
|---|---|---|---|
| Host org | Kendall Yards Night Market | `10000000-0000-4000-8000-000000000002` | receives the payout |
| Vendor org | Pinecrafted Goods | `20000000-0000-4000-8000-000000000002` | pays |
| Opportunity | August Night Market — Maker Stalls | `60000000-0000-4000-8000-000000000002` | `receiving_bids`, public |
| Inventory unit | Stall 12 — Center block | `70000000-0000-4000-8000-000000000003` | floor $220, buy-now $360 |

## The numbers (canonical proof values)

| Quantity | Value | Cents |
|---|---|---|
| Bid / gross | **$280.00** | `28000` |
| Platform fee (10%, D018) | **$28.00** | `2800` |
| Host payout | **$252.00** | `25200` |

## Preconditions

1. Stripe live/test keys in Doppler `bidspace/prd` (or `dev` for test mode) —
   `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
2. Webhook endpoint registered at `https://<host>/api/stripe/webhook` for
   `checkout.session.completed`, `checkout.session.expired`,
   `payment_intent.payment_failed`.
3. Clerk live so a real human can sign in as each side (or use two browsers).

## Procedure

1. **Host onboarding.** Sign in to the Kendall Yards host org → `/host/settings`
   → **Connect payouts with Stripe** → complete Stripe-hosted onboarding.
   - *Creates:* a connected account via controller properties (D028) with the
     `transfers` capability; `organizations.stripe_account_id` is stored.
   - *Verify:* the page shows **Charges: Enabled / Payouts: Enabled**
     (`getConnectAccountStatus`).
2. **Vendor bids.** Sign in to Pinecrafted Goods → open Stall 12 → bid **$280**.
   - *Creates:* `bids` row, status `submitted`, `amount_cents = 28000`.
   - *Event:* `bid_submitted`.
3. **Host awards.** As the host → `/host/bids` → **Award & request payment** on
   that bid.
   - *Transitions:* bid → `payment_pending`; `bookings` row created
     (`price_cents = 28000`, terms snapshot); `payments` row `pending`
     (`platform_fee_cents = 2800`, `host_payout_cents = 25200`); unit → reserved
     → payment_pending.
   - *Event:* `bid_awarded`.
4. **Vendor pays.** As the vendor → the booking → **Pay** → Stripe Checkout →
   `4242 4242 4242 4242` (test) or a real card (live).
   - *Creates (Stripe):* a PaymentIntent with `application_fee_amount = 2800`
     and `transfer_data.destination = <host account>`.
5. **Webhook settles.** `checkout.session.completed` arrives.
   - *Transitions:* `payments` → `paid` (with `stripe_payment_intent_id`);
     booking → `confirmed`; bid → `paid` → `booked`; unit → `booked`.
   - *Idempotent + crash-safe:* the event is recorded in
     `stripe_webhook_events` only **after** settlement succeeds, so a retry
     re-settles rather than stranding the booking.
   - *Event:* `booking_paid`.

## Expected end state (assert all)

| Store | Assertion |
|---|---|
| `bids` | status `booked`, `amount_cents 28000` |
| `bookings` | status `confirmed`, `price_cents 28000` |
| `payments` | status `paid`, fee `2800`, payout `25200`, `stripe_payment_intent_id` set |
| `inventory_units` | Stall 12 status `booked` |
| Stripe dashboard | PaymentIntent shows $28.00 application fee on platform + $252.00 transfer to the connected account |
| PostHog | `booking_paid` event for the vendor org |

## Cleanup (test mode)

Restore the fixture for reuse:
```sql
delete from payments where booking_id in
  (select id from bookings where inventory_unit_id = '70000000-0000-4000-8000-000000000003');
delete from bookings where inventory_unit_id = '70000000-0000-4000-8000-000000000003';
delete from bids where inventory_unit_id = '70000000-0000-4000-8000-000000000003'
  and bidder_organization_id = '20000000-0000-4000-8000-000000000002';
update inventory_units set status = 'receiving_bids'
  where id = '70000000-0000-4000-8000-000000000003';
```
`tools/live-loop-check.ts` performs this exact create-and-clean cycle
programmatically and can be used as the automated regression once live.

## Live-mode note

In live mode, use a real card for a small real charge, confirm the transfer +
fee in the Stripe dashboard, then **refund** the PaymentIntent. Refund handling
beyond this manual step (dispute/refund webhooks → `payments.refunded`) is a
documented post-launch follow-up.
