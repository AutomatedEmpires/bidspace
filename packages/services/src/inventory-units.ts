import type { BidspaceClient, InventoryUnitRow } from "@bidspace/db";
import {
  inventoryUnitCreateSchema,
  type InventoryUnitCreate,
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
