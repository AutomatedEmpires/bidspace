import { test } from "node:test";
import assert from "node:assert/strict";
import { splitPayment, buildConnectChargeParams } from "./payments.js";
import { ValidationError } from "./errors.js";

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
