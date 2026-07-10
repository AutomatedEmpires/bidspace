import { test } from "node:test";
import assert from "node:assert/strict";
import {
  splitPayment,
  buildConnectChargeParams,
  classifyRefund,
  classifyDisputeClose,
} from "./payments";
import { paymentStatusTransitions, canTransition } from "@bidspace/core";
import { ValidationError } from "./errors";

test("splitPayment applies the locked 10% platform fee (D018)", () => {
  const split = splitPayment(10_000);
  assert.equal(split.platformFeeCents, 1000);
  assert.equal(split.hostPayoutCents, 9000);
  assert.equal(split.feeBps, 1000);
});

test("splitPayment honors a fee-bps override", () => {
  const split = splitPayment(10_000, 1500);
  assert.equal(split.platformFeeCents, 1500);
  assert.equal(split.hostPayoutCents, 8500);
});

test("splitPayment rejects non-positive or non-integer amounts", () => {
  assert.throws(() => splitPayment(0), ValidationError);
  assert.throws(() => splitPayment(12.5), ValidationError);
});

test("buildConnectChargeParams routes the remainder to the host connected account", () => {
  const params = buildConnectChargeParams({
    amountCents: 25_000,
    hostStripeAccountId: "acct_123",
    metadata: { booking_id: "b1" },
  });
  assert.equal(params.amount, 25_000);
  assert.equal(params.currency, "usd");
  assert.equal(params.application_fee_amount, 2500);
  assert.equal(params.transfer_data.destination, "acct_123");
  assert.deepEqual(params.metadata, { booking_id: "b1" });
});

test("buildConnectChargeParams requires a connected account", () => {
  assert.throws(
    () => buildConnectChargeParams({ amountCents: 1000, hostStripeAccountId: "" }),
    ValidationError,
  );
});

test("classifyRefund distinguishes full, partial, and no refund", () => {
  assert.equal(classifyRefund(28_000, 28_000), "refunded");
  assert.equal(classifyRefund(28_000, 30_000), "refunded"); // over-refund clamps to full
  assert.equal(classifyRefund(28_000, 10_000), "partially_refunded");
  assert.equal(classifyRefund(28_000, 0), null);
  assert.equal(classifyRefund(28_000, -5), null);
});

test("refund/dispute states are reachable from a paid payment (state machine)", () => {
  // The webhook only ever refunds/disputes a settled payment; assert those
  // transitions are legal so the handlers can't silently no-op on a valid event.
  assert.ok(canTransition(paymentStatusTransitions, "paid", "refunded"));
  assert.ok(canTransition(paymentStatusTransitions, "paid", "partially_refunded"));
  assert.ok(canTransition(paymentStatusTransitions, "paid", "disputed"));
  assert.ok(canTransition(paymentStatusTransitions, "partially_refunded", "refunded"));
  // And a fully-refunded payment is terminal — a replay can't move it again.
  assert.ok(!canTransition(paymentStatusTransitions, "refunded", "refunded"));
});

test("classifyDisputeClose maps won/lost and ignores non-terminal statuses", () => {
  assert.equal(classifyDisputeClose("won"), "paid_out");
  assert.equal(classifyDisputeClose("lost"), "refunded");
  assert.equal(classifyDisputeClose("warning_closed"), null);
  assert.equal(classifyDisputeClose("needs_response"), null);
  assert.equal(classifyDisputeClose(""), null);
});

test("dispute-close outcomes are legal transitions from a disputed payment", () => {
  // won -> paid_out, lost -> refunded must both be reachable from `disputed`,
  // or the webhook would silently swallow a resolved chargeback.
  assert.ok(canTransition(paymentStatusTransitions, "disputed", "paid_out"));
  assert.ok(canTransition(paymentStatusTransitions, "disputed", "refunded"));
});
