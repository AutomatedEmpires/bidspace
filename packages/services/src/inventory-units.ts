import type { BidspaceClient, InventoryUnitRow } from "@bidspace/db";
import {
  inventoryUnitCreateSchema,
  inventoryUnitUpdateSchema,
  type InventoryUnitCreate,
  type InventoryUnitUpdate,
  type InventoryUnitStatus,
  inventoryUnitStatusTransitions,
  canTransition,
} from "@bidspace/core";
import { NotFoundError, TransitionError, ValidationError, fromDbError } from "./errors.js";
import { toGeoPoint, type GeoPoint } from "./geo.js";

export async function createInventoryUnit(
  db: BidspaceClient,
  input: InventoryUnitCreate,
): Promise<InventoryUnitRow> {
  const parsed = inventoryUnitCreateSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError("Invalid inventory unit input", parsed.error.flatten());
  }
  const u = parsed.data;
  const { data, error } = await db
    .from("inventory_units")
    .insert({
      opportunity_id: u.opportunityId,
      organization_id: u.organizationId,
      venue_id: u.venueId ?? null,
      event_id: u.eventId ?? null,
      type: u.type,
      name: u.name,
      commerce_layer: u.commerceLayer ?? null,
      pricing_mode: u.pricingMode,
      minimum_bid_cents: u.minimumBidCents ?? null,
      buy_now_price_cents: u.buyNowPriceCents ?? null,
      reserve_price_cents: u.reservePriceCents ?? null,
      availability_start: u.availabilityStart,
      availability_end: u.availabilityEnd,
      location: toOptionalGeoPoint(u.latitude, u.longitude),
      notes: u.notes ?? null,
      status: "draft" satisfies InventoryUnitStatus,
    })
    .select("*")
    .single();
  if (error) throw fromDbError("createInventoryUnit", error);
  return data as InventoryUnitRow;
}

export async function updateInventoryUnit(
  db: BidspaceClient,
  id: string,
  organizationId: string,
  input: InventoryUnitUpdate,
): Promise<InventoryUnitRow> {
  const parsed = inventoryUnitUpdateSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError("Invalid inventory unit update", parsed.error.flatten());
  }
  const u = parsed.data;
  const update: Record<string, unknown> = compact({
    opportunity_id: u.opportunityId,
    venue_id: u.venueId,
    event_id: u.eventId,
    type: u.type,
    name: u.name,
    commerce_layer: u.commerceLayer,
    pricing_mode: u.pricingMode,
    minimum_bid_cents: u.minimumBidCents,
    buy_now_price_cents: u.buyNowPriceCents,
    reserve_price_cents: u.reservePriceCents,
    availability_start: u.availabilityStart,
    availability_end: u.availabilityEnd,
    notes: u.notes,
    status: u.status,
  });
  if (typeof u.latitude === "number" && typeof u.longitude === "number") {
    update.location = toGeoPoint(u.latitude, u.longitude);
  }
  const { data, error } = await db
    .from("inventory_units")
    .update(update)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select("*")
    .maybeSingle();
  if (error) throw fromDbError("updateInventoryUnit", error);
  if (!data) throw new NotFoundError("inventory_unit", id);
  return data as InventoryUnitRow;
}

export async function getInventoryUnit(
  db: BidspaceClient,
  id: string,
): Promise<InventoryUnitRow> {
  const { data, error } = await db
    .from("inventory_units")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw fromDbError("getInventoryUnit", error);
  if (!data) throw new NotFoundError("inventory_unit", id);
  return data as InventoryUnitRow;
}

export async function listInventoryUnitsForOpportunity(
  db: BidspaceClient,
  opportunityId: string,
): Promise<InventoryUnitRow[]> {
  const { data, error } = await db
    .from("inventory_units")
    .select("*")
    .eq("opportunity_id", opportunityId)
    .order("created_at", { ascending: false });
  if (error) throw fromDbError("listInventoryUnitsForOpportunity", error);
  return (data ?? []) as InventoryUnitRow[];
}

export async function listInventoryUnitsForOrg(
  db: BidspaceClient,
  organizationId: string,
): Promise<InventoryUnitRow[]> {
  const { data, error } = await db
    .from("inventory_units")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw fromDbError("listInventoryUnitsForOrg", error);
  return (data ?? []) as InventoryUnitRow[];
}

export async function transitionInventoryUnit(
  db: BidspaceClient,
  id: string,
  to: InventoryUnitStatus,
): Promise<InventoryUnitRow> {
  const current = await getInventoryUnit(db, id);
  if (!canTransition(inventoryUnitStatusTransitions, current.status, to)) {
    throw new TransitionError(`Illegal inventory unit transition: ${current.status} -> ${to}`);
  }
  const { data, error } = await db
    .from("inventory_units")
    .update({ status: to })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw fromDbError("transitionInventoryUnit", error);
  return data as InventoryUnitRow;
}

function toOptionalGeoPoint(latitude: number | undefined, longitude: number | undefined): GeoPoint | null {
  return typeof latitude === "number" && typeof longitude === "number" ? toGeoPoint(latitude, longitude) : null;
}

function compact(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}
