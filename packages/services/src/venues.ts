import type { BidspaceClient, VenueRow } from "@bidspace/db";
import { venueCreateSchema, type VenueCreate } from "@bidspace/core";
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
