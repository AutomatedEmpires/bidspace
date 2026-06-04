import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canTransition,
  assertTransition,
  nextStates,
  bidStatusTransitions,
  paymentStatusTransitions,
  opportunityStatusTransitions,
} from "./state-machines";

test("bid: draft -> submitted is allowed", () => {
  assert.equal(canTransition(bidStatusTransitions, "draft", "submitted"), true);
});

test("bid: draft -> paid is illegal (must flow through acceptance + payment)", () => {
  assert.equal(canTransition(bidStatusTransitions, "draft", "paid"), false);
});

test("bid: full happy path accepted -> payment_pending -> paid -> booked -> completed", () => {
  assert.equal(canTransition(bidStatusTransitions, "accepted", "payment_pending"), true);
  assert.equal(canTransition(bidStatusTransitions, "payment_pending", "paid"), true);
  assert.equal(canTransition(bidStatusTransitions, "paid", "booked"), true);
  assert.equal(canTransition(bidStatusTransitions, "booked", "completed"), true);
});

test("terminal states have no outgoing transitions", () => {
  assert.deepEqual(nextStates(bidStatusTransitions, "rejected"), []);
  assert.deepEqual(nextStates(opportunityStatusTransitions, "archived"), []);
});

test("assertTransition throws on an illegal payment transition", () => {
  assert.throws(() => assertTransition(paymentStatusTransitions, "refunded", "paid"));
});

test("assertTransition passes on a legal payment transition", () => {
  assert.doesNotThrow(() => assertTransition(paymentStatusTransitions, "pending", "authorized"));
});
