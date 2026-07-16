import test from "node:test";
import assert from "node:assert/strict";
import { MARKETPLACE_STATE, assertPaymentsEnabled } from "./marketplace-state";

test("the marketplace cannot imply launch or move money", () => {
  assert.equal(MARKETPLACE_STATE.isLive, false);
  assert.equal(MARKETPLACE_STATE.paymentsEnabled, false);
  assert.equal(MARKETPLACE_STATE.legalCommitmentsEnabled, false);
  assert.throws(assertPaymentsEnabled, /founder-gated/);
});

