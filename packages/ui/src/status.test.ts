import { test } from "node:test";
import assert from "node:assert/strict";
import { statusLabel, statusTone } from "./status";

test("statusTone maps every bid status to a defined tone", () => {
  const bidStatuses = [
    "draft",
    "submitted",
    "viewed",
    "shortlisted",
    "countered",
    "accepted",
    "rejected",
    "waitlisted",
    "expired",
    "withdrawn",
    "payment_pending",
    "paid",
    "booked",
    "completed",
    "reviewed",
  ];
  for (const status of bidStatuses) {
    const tone = statusTone(status);
    assert.ok(
      ["positive", "active", "attention", "negative", "neutral"].includes(tone),
      `unexpected tone for ${status}: ${tone}`,
    );
  }
});

test("statusTone maps decision-needed states to attention", () => {
  for (const status of ["submitted", "shortlisted", "payment_pending", "pending_verification"]) {
    assert.equal(statusTone(status), "attention", status);
  }
});

test("statusTone maps refusals and failures to negative", () => {
  for (const status of ["rejected", "cancelled", "disputed", "failed", "expired"]) {
    assert.equal(statusTone(status), "negative", status);
  }
});

test("statusTone falls back to neutral for unknown vocab", () => {
  assert.equal(statusTone("some_future_status"), "neutral");
});

test("statusLabel humanizes underscores", () => {
  assert.equal(statusLabel("payment_pending"), "payment pending");
});
