/**
 * Live marketplace-loop verification against the provisioned Supabase project.
 *
 * Drives the exact service functions the web app's server actions call:
 *   placeBid -> view -> shortlist -> counter -> accept(counter) ->
 *   requestBidPayment -> createBookingForBid -> initiateBookingPayment ->
 *   [settlement as the Stripe webhook would] recordPaymentResult(paid) ->
 *   settleBookingPayment -> unit -> booked
 * then asserts every state + the D018 money split, and cleans up after itself.
 *
 * Run:  set -a && source apps/web/.env.local && set +a && \
 *       pnpm --filter @bidspace/web exec tsx ../../tools/live-loop-check.ts
 */
import { createBidspaceClient } from "@bidspace/db";
import {
  acceptBid,
  counterBid,
  createBookingForBid,
  getBid,
  getBooking,
  getInventoryUnit,
  initiateBookingPayment,
  placeBid,
  recordPaymentResult,
  requestBidPayment,
  settleBookingPayment,
  shortlistBid,
  transitionBid,
  transitionInventoryUnit,
  viewBid,
} from "@bidspace/services";

const VENDOR_ORG = "20000000-0000-4000-8000-000000000002"; // Pinecrafted Goods
const OPPORTUNITY = "60000000-0000-4000-8000-000000000002"; // August Night Market
const UNIT = "70000000-0000-4000-8000-000000000003"; // Stall 12

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("FAIL: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set");
  process.exit(1);
}
const db = createBidspaceClient({ url, key });

let failures = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const ok = actual === expected;
  if (!ok) failures += 1;
  console.log(`${ok ? "  ok " : "  FAIL"} ${label}: ${String(actual)}${ok ? "" : ` (expected ${String(expected)})`}`);
}

async function main() {
  console.log("== live marketplace loop ==");

  // 1 · Vendor places a sealed bid.
  const bid = await placeBid(db, {
    bidderOrganizationId: VENDOR_ORG,
    opportunityId: OPPORTUNITY,
    inventoryUnitId: UNIT,
    amountCents: 24000,
    intendedUse: "[live-loop-check] hand-turned woodware, 10x10 canopy",
  });
  check("bid created", bid.status, "submitted");

  try {
    // 2 · Host pipeline: view -> shortlist -> counter.
    await viewBid(db, bid.id);
    await shortlistBid(db, bid.id);
    const countered = await counterBid(db, bid.id, 28000);
    check("countered at 28000", countered.counter_amount_cents, 28000);

    // 3 · Vendor accepts the counter (locks the countered amount).
    const accepted = await transitionBid(db, bid.id, "accepted", { amount_cents: 28000 });
    check("accepted at counter", accepted.amount_cents, 28000);

    // 4 · Award chain: payment request -> booking (terms snapshot) -> payment record.
    await requestBidPayment(db, bid.id);
    const booking = await createBookingForBid(db, bid.id);
    check("booking pending_payment", booking.status, "pending_payment");
    check("booking price snapshot", booking.price_cents, 28000);

    const payment = await initiateBookingPayment(db, { bookingId: booking.id });
    check("payment pending", payment.status, "pending");
    check("platform fee 10% (D018)", payment.platform_fee_cents, 2800);
    check("host payout 90%", payment.host_payout_cents, 25200);

    // Unit follows into reservation.
    await transitionInventoryUnit(db, UNIT, "reserved");
    await transitionInventoryUnit(db, UNIT, "payment_pending");

    // 5 · Settlement exactly as the webhook applies it.
    await recordPaymentResult(db, payment.id, "paid", {
      stripe_payment_intent_id: "pi_live_loop_check",
    });
    await settleBookingPayment(db, booking.id);
    await transitionInventoryUnit(db, UNIT, "booked");

    const finalBid = await getBid(db, bid.id);
    const finalBooking = await getBooking(db, booking.id);
    const finalUnit = await getInventoryUnit(db, UNIT);
    check("bid booked", finalBid.status, "booked");
    check("booking confirmed", finalBooking.status, "confirmed");
    check("unit booked", finalUnit.status, "booked");

    // 6 · Cleanup: remove loop artifacts, restore the unit for the marketplace.
    await db.from("payments").delete().eq("booking_id", booking.id);
    await db.from("bookings").delete().eq("id", booking.id);
  } finally {
    await db.from("bids").delete().eq("id", bid.id);
    await db
      .from("inventory_units")
      .update({ status: "receiving_bids" })
      .eq("id", UNIT);
  }

  const restored = await getInventoryUnit(db, UNIT);
  check("unit restored for marketplace", restored.status, "receiving_bids");

  console.log(failures === 0 ? "== PASS: full loop verified live ==" : `== ${failures} FAILURES ==`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error("FAIL:", error);
  process.exit(1);
});
