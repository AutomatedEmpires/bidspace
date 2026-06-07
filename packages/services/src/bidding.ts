import type { BidspaceClient, BidRow } from "@bidspace/db";
import {
  bidCreateSchema,
  type BidCreate,
  type BidStatus,
  type OpportunityStatus,
  bidStatusTransitions,
  canTransition,
} from "@bidspace/core";
import { NotFoundError, TransitionError, ValidationError, fromDbError } from "./errors";
import { getOpportunity } from "./opportunities";
import { getInventoryUnit } from "./inventory-units";

// Pure, persistence-free guard for whether a bid may be placed.
export interface BidEligibilityInput {
  opportunityStatus: OpportunityStatus;
  amountCents: number;
  minimumBidCents: number | null;
}

export function assertBidAcceptable(input: BidEligibilityInput): void {
  if (input.opportunityStatus !== "receiving_bids") {
    throw new ValidationError(
      `Opportunity is not accepting bids (status: ${input.opportunityStatus})`,
    );
  }
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    throw new ValidationError("Bid amount must be a positive integer number of cents");
  }
  if (input.minimumBidCents != null && input.amountCents < input.minimumBidCents) {
    throw new ValidationError(
      `Bid of ${input.amountCents} cents is below the minimum of ${input.minimumBidCents} cents`,
    );
  }
}

// Sealed-bid visibility (D019): bidders only ever see their own bids; the host
// org that owns the opportunity sees all bids. There is no public leaderboard in
// MVP — competing bid amounts are never exposed to other bidders.
export interface BidViewer {
  organizationId: string;
  /** True when the viewer is the host org that owns the opportunity. */
  isHost: boolean;
}

export function visibleBidsFor<T extends { bidder_organization_id: string }>(
  bids: readonly T[],
  viewer: BidViewer,
): T[] {
  if (viewer.isHost) return [...bids];
  return bids.filter((b) => b.bidder_organization_id === viewer.organizationId);
}

// Place a bid against an opportunity (and optionally a specific inventory unit).
// Bids are created `submitted` and sealed by default (D019).
export async function placeBid(db: BidspaceClient, input: BidCreate): Promise<BidRow> {
  const parsed = bidCreateSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError("Invalid bid input", parsed.error.flatten());
  }
  const b = parsed.data;

  const opportunity = await getOpportunity(db, b.opportunityId);
  // Unit-level minimum wins when bidding on a unit, else the opportunity minimum.
  let minimumBidCents = opportunity.minimum_bid_cents;
  if (b.inventoryUnitId) {
    const unit = await getInventoryUnit(db, b.inventoryUnitId);
    minimumBidCents = unit.minimum_bid_cents ?? opportunity.minimum_bid_cents;
  }
  assertBidAcceptable({
    opportunityStatus: opportunity.status,
    amountCents: b.amountCents,
    minimumBidCents,
  });

  const { data, error } = await db
    .from("bids")
    .insert({
      bidder_organization_id: b.bidderOrganizationId,
      host_organization_id: opportunity.organization_id,
      opportunity_id: b.opportunityId,
      inventory_unit_id: b.inventoryUnitId ?? null,
      amount_cents: b.amountCents,
      commerce_layer: b.commerceLayer ?? null,
      intended_use: b.intendedUse ?? null,
      status: "submitted" satisfies BidStatus,
    })
    .select("*")
    .single();
  if (error) throw fromDbError("placeBid", error);
  return data as BidRow;
}

export async function getBid(db: BidspaceClient, id: string): Promise<BidRow> {
  const { data, error } = await db.from("bids").select("*").eq("id", id).maybeSingle();
  if (error) throw fromDbError("getBid", error);
  if (!data) throw new NotFoundError("bid", id);
  return data as BidRow;
}

// Sealed visibility is enforced at the query layer: bidders are scoped to their
// own org; only the host sees the full set.
export async function listBidsForOpportunity(
  db: BidspaceClient,
  opportunityId: string,
  viewer: BidViewer,
): Promise<BidRow[]> {
  let query = db
    .from("bids")
    .select("*")
    .eq("opportunity_id", opportunityId)
    .order("amount_cents", { ascending: false });
  if (!viewer.isHost) {
    query = query.eq("bidder_organization_id", viewer.organizationId);
  }
  const { data, error } = await query;
  if (error) throw fromDbError("listBidsForOpportunity", error);
  return (data ?? []) as BidRow[];
}

// Generic bid transition guarded by the canonical bid state machine.
export async function transitionBid(
  db: BidspaceClient,
  id: string,
  to: BidStatus,
  patch: Record<string, unknown> = {},
): Promise<BidRow> {
  const current = await getBid(db, id);
  if (!canTransition(bidStatusTransitions, current.status, to)) {
    throw new TransitionError(`Illegal bid transition: ${current.status} -> ${to}`);
  }
  const { data, error } = await db
    .from("bids")
    .update({ status: to, ...patch })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw fromDbError("transitionBid", error);
  return data as BidRow;
}

// Host bid-pipeline actions. Each is a thin, guarded wrapper; the state machine
// enforces legal ordering (e.g. a bid must be viewed/shortlisted before accept).
export const viewBid = (db: BidspaceClient, id: string) => transitionBid(db, id, "viewed");
export const shortlistBid = (db: BidspaceClient, id: string) => transitionBid(db, id, "shortlisted");
export const acceptBid = (db: BidspaceClient, id: string) => transitionBid(db, id, "accepted");
export const rejectBid = (db: BidspaceClient, id: string) => transitionBid(db, id, "rejected");
export const waitlistBid = (db: BidspaceClient, id: string) => transitionBid(db, id, "waitlisted");
export const withdrawBid = (db: BidspaceClient, id: string) => transitionBid(db, id, "withdrawn");

// Host counters with a new price; recorded on the bid for the bidder to accept.
export async function counterBid(
  db: BidspaceClient,
  id: string,
  counterAmountCents: number,
): Promise<BidRow> {
  if (!Number.isInteger(counterAmountCents) || counterAmountCents <= 0) {
    throw new ValidationError("Counter amount must be a positive integer number of cents");
  }
  return transitionBid(db, id, "countered", { counter_amount_cents: counterAmountCents });
}

// Host accepted the bid and now requests payment, moving it into payment_pending.
export const requestBidPayment = (db: BidspaceClient, id: string) =>
  transitionBid(db, id, "payment_pending");
