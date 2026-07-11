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
import { NotFoundError, TransitionError, ValidationError, fromDbError } from "./errors";
import { toGeoPoint } from "./geo";

export async function createInventoryUnit(
  db: BidspaceClient,
  input: InventoryUnitCreate,
): Promise<InventoryUnitRow> {
  const parsed = inventoryUnitCreateSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError("Invalid inventory unit input", parsed.error.flatten());
  }
  const u = parsed.data;
  if (u.availabilityEnd < u.availabilityStart) {
    throw new ValidationError("availabilityEnd must be on or after availabilityStart");
  }
  const { data, error } = await db
    .from("inventory_units")
    .insert({
      opportunity_id: u.opportunityId,
      organization_id: u.organizationId,
      type: u.type,
      name: u.name,
      pricing_mode: u.pricingMode,
      minimum_bid_cents: u.minimumBidCents ?? null,
      availability_start: u.availabilityStart,
      availability_end: u.availabilityEnd,
      location: toGeoPoint(u.latitude, u.longitude),
      status: "draft" satisfies InventoryUnitStatus,
    })
    .select("*")
    .single();
  if (error) throw fromDbError("createInventoryUnit", error);
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
    .is("archived_at", null)
    .order("created_at", { ascending: false });
  if (error) throw fromDbError("listInventoryUnitsForOrg", error);
  return (data ?? []) as InventoryUnitRow[];
}

export async function updateInventoryUnit(
  db: BidspaceClient,
  id: string,
  patch: InventoryUnitUpdate,
): Promise<InventoryUnitRow> {
  const parsed = inventoryUnitUpdateSchema.safeParse(patch);
  if (!parsed.success) {
    throw new ValidationError("Invalid inventory unit update", parsed.error.flatten());
  }
  const p = parsed.data;
  const update: Record<string, unknown> = {};
  if (p.name !== undefined) update.name = p.name;
  if (p.dimensions !== undefined) update.dimensions = p.dimensions;
  if (p.indoor !== undefined) update.indoor = p.indoor;
  if (p.powerAvailable !== undefined) update.power_available = p.powerAvailable;
  if (p.waterAvailable !== undefined) update.water_available = p.waterAvailable;
  if (p.wifiAvailable !== undefined) update.wifi_available = p.wifiAvailable;
  if (p.vehicleAccess !== undefined) update.vehicle_access = p.vehicleAccess;
  if (p.setupWindow !== undefined) update.setup_window = p.setupWindow;
  if (p.teardownWindow !== undefined) update.teardown_window = p.teardownWindow;
  if (p.requiredDocuments !== undefined) update.required_documents = p.requiredDocuments;
  if (p.categoryRestrictions !== undefined) update.category_restrictions = p.categoryRestrictions;
  if (p.notes !== undefined) update.notes = p.notes;
  if (p.minimumBidCents !== undefined) update.minimum_bid_cents = p.minimumBidCents;
  if (p.buyNowPriceCents !== undefined) update.buy_now_price_cents = p.buyNowPriceCents;
  if (Object.keys(update).length === 0) return getInventoryUnit(db, id);

  const { data, error } = await db
    .from("inventory_units")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw fromDbError("updateInventoryUnit", error);
  return data as InventoryUnitRow;
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
