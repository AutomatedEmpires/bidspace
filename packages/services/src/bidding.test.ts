import { test } from "node:test";
import assert from "node:assert/strict";
import { assertBidAcceptable, visibleBidsFor } from "./bidding";
import { ValidationError } from "./errors";

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

const bids = [
  { bidder_organization_id: "org-a", amount_cents: 9000 },
  { bidder_organization_id: "org-b", amount_cents: 8000 },
];

test("sealed bids: a bidder only sees their own bids (D019)", () => {
  const visible = visibleBidsFor(bids, { organizationId: "org-a", isHost: false });
  assert.equal(visible.length, 1);
  assert.equal(visible[0]?.bidder_organization_id, "org-a");
});

test("sealed bids: the host sees every bid", () => {
  const visible = visibleBidsFor(bids, { organizationId: "host-org", isHost: true });
  assert.equal(visible.length, 2);
});
