import type { BidspaceClient, OpportunityRow } from "@bidspace/db";
import {
  opportunityCreateSchema,
  opportunityUpdateSchema,
  type OpportunityCreate,
  type OpportunityStatus,
  opportunityStatusTransitions,
  canTransition,
} from "@bidspace/core";
import { NotFoundError, TransitionError, ValidationError, fromDbError } from "./errors";
import { slugWithRef } from "./slug";

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

export interface OpportunityUpdatePatch {
  title?: string;
  description?: string;
  audienceProfile?: string;
  estimatedAttendance?: number;
  categoryTags?: string[];
  startsAt?: string;
  endsAt?: string;
  visibility?: "public" | "network" | "invite_only";
  pricingMode?: OpportunityRow["pricing_mode"];
  commerceLayer?: OpportunityRow["commerce_layer"];
  minimumBidCents?: number | null;
  bidDeadline?: string | null;
  imageUrls?: string[];
}

// Draft-stage edits. Published listings only accept the fields that do not
// silently rewrite what bidders already agreed to look at.
export async function updateOpportunity(
  db: BidspaceClient,
  id: string,
  patch: OpportunityUpdatePatch,
): Promise<OpportunityRow> {
  const parsed = opportunityUpdateSchema.safeParse(patch);
  if (!parsed.success) {
    throw new ValidationError("Invalid opportunity update", parsed.error.flatten());
  }
  const p = parsed.data;
  const update: Record<string, unknown> = {};
  if (p.title !== undefined) update.title = p.title;
  if (p.description !== undefined) update.description = p.description;
  if (p.audienceProfile !== undefined) update.audience_profile = p.audienceProfile;
  if (p.estimatedAttendance !== undefined) update.estimated_attendance = p.estimatedAttendance;
  if (p.categoryTags !== undefined) update.category_tags = p.categoryTags;
  if (p.startsAt !== undefined) update.starts_at = p.startsAt;
  if (p.endsAt !== undefined) update.ends_at = p.endsAt;
  if (p.visibility !== undefined) update.visibility = p.visibility;
  if (p.pricingMode !== undefined) update.pricing_mode = p.pricingMode;
  if (p.commerceLayer !== undefined) update.commerce_layer = p.commerceLayer;
  if (p.minimumBidCents !== undefined) update.minimum_bid_cents = p.minimumBidCents;
  if (p.bidDeadline !== undefined) update.bid_deadline = p.bidDeadline;
  if (p.imageUrls !== undefined) update.image_urls = p.imageUrls;
  if (Object.keys(update).length === 0) return getOpportunity(db, id);

  const { data, error } = await db
    .from("opportunities")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw fromDbError("updateOpportunity", error);
  return data as OpportunityRow;
}

// Publishing is the host activation moment: stamps the public slug, validates
// the listing has at least one inventory unit, and moves draft -> published.
export async function publishOpportunity(db: BidspaceClient, id: string): Promise<OpportunityRow> {
  const current = await getOpportunity(db, id);
  if (!canTransition(opportunityStatusTransitions, current.status, "published")) {
    throw new TransitionError(`Illegal opportunity transition: ${current.status} -> published`);
  }
  const units = await db
    .from("inventory_units")
    .select("id", { count: "exact", head: true })
    .eq("opportunity_id", id)
    .is("archived_at", null);
  if (units.error) throw fromDbError("publishOpportunity", units.error);
  if (!units.count) {
    throw new ValidationError(
      "Add at least one inventory unit before publishing — bidders need a real space to pursue.",
    );
  }
  const slug = current.slug ?? slugWithRef(current.title, current.id);
  const { data, error } = await db
    .from("opportunities")
    .update({ status: "published", slug })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw fromDbError("publishOpportunity", error);
  return data as OpportunityRow;
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
