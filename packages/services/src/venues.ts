import type { BidspaceClient, VenueRow } from "@bidspace/db";
import { venueCreateSchema, venueUpdateSchema, type VenueCreate, type VenueUpdate } from "@bidspace/core";
import { NotFoundError, ValidationError, fromDbError } from "./errors";
import { toGeoPoint } from "./geo";

export async function createVenue(db: BidspaceClient, input: VenueCreate): Promise<VenueRow> {
  const parsed = venueCreateSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError("Invalid venue input", parsed.error.flatten());
  }
  const v = parsed.data;
  const { data, error } = await db
    .from("venues")
    .insert({
      organization_id: v.organizationId,
      name: v.name,
      venue_type: v.venueType,
      address_line_1: v.addressLine1,
      address_line_2: v.addressLine2 ?? null,
      city: v.city,
      state: v.state,
      postal_code: v.postalCode ?? null,
      country: v.country,
      location: toGeoPoint(v.latitude, v.longitude),
    })
    .select("*")
    .single();
  if (error) throw fromDbError("createVenue", error);
  return data as VenueRow;
}

export async function getVenue(db: BidspaceClient, id: string): Promise<VenueRow> {
  const { data, error } = await db.from("venues").select("*").eq("id", id).maybeSingle();
  if (error) throw fromDbError("getVenue", error);
  if (!data) throw new NotFoundError("venue", id);
  return data as VenueRow;
}

export async function listVenuesForOrg(
  db: BidspaceClient,
  organizationId: string,
): Promise<VenueRow[]> {
  const { data, error } = await db
    .from("venues")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw fromDbError("listVenuesForOrg", error);
  return (data ?? []) as VenueRow[];
}

export async function updateVenue(
  db: BidspaceClient,
  id: string,
  patch: VenueUpdate,
): Promise<VenueRow> {
  const parsed = venueUpdateSchema.safeParse(patch);
  if (!parsed.success) throw new ValidationError("Invalid venue update", parsed.error.flatten());
  const p = parsed.data;
  const update: Record<string, unknown> = {};
  if (p.name !== undefined) update.name = p.name;
  if (p.description !== undefined) update.description = p.description;
  if (p.capacity !== undefined) update.capacity = p.capacity;
  if (p.parkingInfo !== undefined) update.parking_info = p.parkingInfo;
  if (p.powerAvailable !== undefined) update.power_available = p.powerAvailable;
  if (p.waterAvailable !== undefined) update.water_available = p.waterAvailable;
  if (p.wifiAvailable !== undefined) update.wifi_available = p.wifiAvailable;
  if (p.restroomInfo !== undefined) update.restroom_info = p.restroomInfo;
  if (p.accessInstructions !== undefined) update.access_instructions = p.accessInstructions;
  if (p.imageUrls !== undefined) update.image_urls = p.imageUrls;
  if (Object.keys(update).length === 0) return getVenue(db, id);

  const { data, error } = await db.from("venues").update(update).eq("id", id).select("*").single();
  if (error) throw fromDbError("updateVenue", error);
  return data as VenueRow;
}

// Activate a draft venue so it can anchor public opportunities.
export async function activateVenue(db: BidspaceClient, id: string): Promise<VenueRow> {
  const { data, error } = await db
    .from("venues")
    .update({ status: "active" })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw fromDbError("activateVenue", error);
  return data as VenueRow;
}
