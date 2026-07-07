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

// --- Recurring releases: copy an opportunity + its units to a new window ----

// Pure: shift an ISO timestamp by the delta between two window starts.
export function shiftInstant(instant: string, fromStart: string, toStart: string): string {
  const delta = new Date(toStart).getTime() - new Date(fromStart).getTime();
  return new Date(new Date(instant).getTime() + delta).toISOString();
}

export interface DuplicateOpportunityInput {
  startsAt: string;
  endsAt: string;
  bidDeadline?: string;
  title?: string;
}

// Hosts should not rebuild the same world every week: this clones a release
// and its inventory units into a fresh draft on new dates. Stable information
// stays stable; dates shift by the window delta; nothing publishes until the
// host reviews and hits publish.
export async function duplicateOpportunityForWindow(
  db: BidspaceClient,
  id: string,
  input: DuplicateOpportunityInput,
): Promise<OpportunityRow> {
  if (new Date(input.endsAt) < new Date(input.startsAt)) {
    throw new ValidationError("endsAt must be on or after startsAt");
  }
  const source = await getOpportunity(db, id);

  const { data: created, error } = await db
    .from("opportunities")
    .insert({
      organization_id: source.organization_id,
      venue_id: source.venue_id,
      event_id: null, // a new window usually means a new/next event; relink explicitly
      collection_id: source.collection_id,
      title: input.title ?? source.title,
      description: source.description,
      commerce_layer: source.commerce_layer,
      pricing_mode: source.pricing_mode,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      location: source.location,
      audience_profile: source.audience_profile,
      estimated_attendance: source.estimated_attendance,
      category_tags: source.category_tags,
      minimum_bid_cents: source.minimum_bid_cents,
      bid_deadline: input.bidDeadline ?? null,
      requirements: source.requirements,
      image_urls: source.image_urls,
      visibility: source.visibility,
      status: "draft" satisfies OpportunityStatus,
    })
    .select("*")
    .single();
  if (error) throw fromDbError("duplicateOpportunityForWindow", error);
  const clone = created as OpportunityRow;

  const { data: units, error: unitsError } = await db
    .from("inventory_units")
    .select("*")
    .eq("opportunity_id", id)
    .is("archived_at", null);
  if (unitsError) throw fromDbError("duplicateOpportunityForWindow:units", unitsError);

  const sourceStart = source.starts_at ?? input.startsAt;
  for (const unit of (units ?? []) as Record<string, unknown>[]) {
    const { error: insertError } = await db.from("inventory_units").insert({
      opportunity_id: clone.id,
      organization_id: unit.organization_id,
      venue_id: unit.venue_id,
      event_id: null,
      zone_id: unit.zone_id,
      collection_id: unit.collection_id,
      type: unit.type,
      name: unit.name,
      commerce_layer: unit.commerce_layer,
      pricing_mode: unit.pricing_mode,
      minimum_bid_cents: unit.minimum_bid_cents,
      buy_now_price_cents: unit.buy_now_price_cents,
      reserve_price_cents: unit.reserve_price_cents,
      availability_start: shiftInstant(String(unit.availability_start), sourceStart, input.startsAt),
      availability_end: shiftInstant(String(unit.availability_end), sourceStart, input.startsAt),
      location: unit.location,
      floorplan_x: unit.floorplan_x,
      floorplan_y: unit.floorplan_y,
      dimensions: unit.dimensions,
      indoor: unit.indoor,
      power_available: unit.power_available,
      water_available: unit.water_available,
      wifi_available: unit.wifi_available,
      vehicle_access: unit.vehicle_access,
      setup_window: unit.setup_window,
      teardown_window: unit.teardown_window,
      required_documents: unit.required_documents,
      category_restrictions: unit.category_restrictions,
      outcome_tags: unit.outcome_tags,
      notes: unit.notes,
      image_urls: unit.image_urls,
      status: "draft",
    });
    if (insertError) throw fromDbError("duplicateOpportunityForWindow:unit", insertError);
  }

  return clone;
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
