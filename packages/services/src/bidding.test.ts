import { test } from "node:test";
import assert from "node:assert/strict";
import { assertBidAcceptable } from "./bidding.js";
import { ValidationError } from "./errors.js";

test("accepts a valid bid at or above the minimum", () => {
  assert.doesNotThrow(() =>
    assertBidAcceptable({ opportunityStatus: "receiving_bids", amountCents: 5000, minimumBidCents: 5000 }),
  );
});

test("rejects a bid when the opportunity is not receiving bids", () => {
  assert.throws(
    () => assertBidAcceptable({ opportunityStatus: "draft", amountCents: 5000, minimumBidCents: null }),
    ValidationError,
  );
});

test("rejects a bid below the minimum", () => {
  assert.throws(
    () => assertBidAcceptable({ opportunityStatus: "receiving_bids", amountCents: 4999, minimumBidCents: 5000 }),
    ValidationError,
  );
});

test("rejects a non-positive or non-integer bid", () => {
  assert.throws(
    () => assertBidAcceptable({ opportunityStatus: "receiving_bids", amountCents: 0, minimumBidCents: null }),
    ValidationError,
  );
  assert.throws(
    () => assertBidAcceptable({ opportunityStatus: "receiving_bids", amountCents: 12.5, minimumBidCents: null }),
    ValidationError,
  );
});
