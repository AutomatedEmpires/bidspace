import type { BidspaceClient, OpportunityRow } from "@bidspace/db";
import {
  opportunityCreateSchema,
  type OpportunityCreate,
  type OpportunityStatus,
  opportunityStatusTransitions,
  canTransition,
} from "@bidspace/core";
import { NotFoundError, TransitionError, ValidationError, fromDbError } from "./errors.js";

export async function createOpportunity(
  db: BidspaceClient,
  input: OpportunityCreate,
): Promise<OpportunityRow> {
  const parsed = opportunityCreateSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError("Invalid opportunity input", parsed.error.flatten());
  }
  const o = parsed.data;
  const { data, error } = await db
    .from("opportunities")
    .insert({
      organization_id: o.organizationId,
      title: o.title,
      venue_id: o.venueId ?? null,
      event_id: o.eventId ?? null,
      pricing_mode: o.pricingMode,
      commerce_layer: o.commerceLayer ?? null,
      minimum_bid_cents: o.minimumBidCents ?? null,
      bid_deadline: o.bidDeadline ?? null,
      status: "draft" satisfies OpportunityStatus,
    })
    .select("*")
    .single();
  if (error) throw fromDbError("createOpportunity", error);
  return data as OpportunityRow;
}

export async function getOpportunity(db: BidspaceClient, id: string): Promise<OpportunityRow> {
  const { data, error } = await db.from("opportunities").select("*").eq("id", id).maybeSingle();
  if (error) throw fromDbError("getOpportunity", error);
  if (!data) throw new NotFoundError("opportunity", id);
  return data as OpportunityRow;
}

export async function listOpportunitiesForOrg(
  db: BidspaceClient,
  organizationId: string,
): Promise<OpportunityRow[]> {
  const { data, error } = await db
    .from("opportunities")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw fromDbError("listOpportunitiesForOrg", error);
  return (data ?? []) as OpportunityRow[];
}

// Lifecycle transition guarded by the canonical opportunity state machine.
export async function transitionOpportunity(
  db: BidspaceClient,
  id: string,
  to: OpportunityStatus,
): Promise<OpportunityRow> {
  const current = await getOpportunity(db, id);
  if (!canTransition(opportunityStatusTransitions, current.status, to)) {
    throw new TransitionError(
      `Illegal opportunity transition: ${current.status} -> ${to}`,
    );
  }
  const { data, error } = await db
    .from("opportunities")
    .update({ status: to })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw fromDbError("transitionOpportunity", error);
  return data as OpportunityRow;
}
