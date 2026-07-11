import { test } from "node:test";
import assert from "node:assert/strict";
import { aggregateReviews, assertReviewAllowed } from "./reviews";
import { ValidationError } from "./errors";

const host = "11111111-1111-1111-1111-111111111111";
const vendor = "22222222-2222-2222-2222-222222222222";
const stranger = "33333333-3333-3333-3333-333333333333";

const completedBooking = {
  status: "completed" as const,
  host_organization_id: host,
  bidder_organization_id: vendor,
};

test("a party to a completed booking may review the counterparty", () => {
  assert.doesNotThrow(() => assertReviewAllowed(completedBooking, host, vendor));
  assert.doesNotThrow(() => assertReviewAllowed(completedBooking, vendor, host));
});

test("reviews are rejected before the booking completes", () => {
  assert.throws(
    () => assertReviewAllowed({ ...completedBooking, status: "confirmed" as const }, host, vendor),
    ValidationError,
  );
});

test("outsiders and self-reviews are rejected", () => {
  assert.throws(() => assertReviewAllowed(completedBooking, stranger, vendor), ValidationError);
  assert.throws(() => assertReviewAllowed(completedBooking, host, stranger), ValidationError);
  assert.throws(() => assertReviewAllowed(completedBooking, host, host), ValidationError);
});

test("aggregateReviews averages published+submitted and reports rebook rate", () => {
  const agg = aggregateReviews([
    { rating: 5, would_book_again: true, status: "published" },
    { rating: 4, would_book_again: true, status: "submitted" },
    { rating: 3, would_book_again: false, status: "published" },
    { rating: 1, would_book_again: false, status: "hidden" }, // excluded
  ]);
  assert.equal(agg.count, 3);
  assert.equal(agg.averageRating, 4);
  assert.equal(agg.wouldBookAgainRate, 67);
});

test("aggregateReviews handles the empty case", () => {
  const agg = aggregateReviews([]);
  assert.equal(agg.count, 0);
  assert.equal(agg.averageRating, null);
  assert.equal(agg.wouldBookAgainRate, null);
});
