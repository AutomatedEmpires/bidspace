import { test } from "node:test";
import assert from "node:assert/strict";
import type { BidspaceClient } from "@bidspace/db";
import { assertBidAcceptable, placeBid, visibleBidsFor } from "./bidding";
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

test("placeBid rejects inventory units that belong to a different opportunity", async () => {
  const insertedBids: unknown[] = [];
  const opportunityId = "00000000-0000-0000-0000-000000000010";
  const mismatchedOpportunityId = "00000000-0000-0000-0000-000000000099";
  const inventoryUnitId = "00000000-0000-0000-0000-000000000020";

  const db = {
    from(table: string) {
      if (table === "opportunities") {
        return {
          select() {
            return {
              eq(_column: string, id: string) {
                return {
                  maybeSingle: async () => ({
                    data:
                      id === opportunityId
                        ? {
                            id: opportunityId,
                            organization_id: "00000000-0000-0000-0000-000000000030",
                            status: "receiving_bids",
                            minimum_bid_cents: 5_000,
                          }
                        : null,
                    error: null,
                  }),
                };
              },
            };
          },
        };
      }

      if (table === "inventory_units") {
        return {
          select() {
            return {
              eq(_column: string, id: string) {
                return {
                  maybeSingle: async () => ({
                    data:
                      id === inventoryUnitId
                        ? {
                            id: inventoryUnitId,
                            opportunity_id: mismatchedOpportunityId,
                            minimum_bid_cents: 6_000,
                          }
                        : null,
                    error: null,
                  }),
                };
              },
            };
          },
        };
      }

      if (table === "bids") {
        return {
          insert(payload: unknown) {
            insertedBids.push(payload);
            return {
              select() {
                return {
                  single: async () => ({ data: payload, error: null }),
                };
              },
            };
          },
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  } as unknown as BidspaceClient;

  await assert.rejects(
    () =>
      placeBid(db, {
        bidderOrganizationId: "00000000-0000-0000-0000-000000000001",
        opportunityId,
        inventoryUnitId,
        amountCents: 7_500,
      }),
    ValidationError,
  );

  assert.equal(insertedBids.length, 0);
});
