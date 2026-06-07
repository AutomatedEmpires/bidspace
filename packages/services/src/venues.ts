import type { BidspaceClient, VenueRow } from "@bidspace/db";
import {
  venueCreateSchema,
  venueUpdateSchema,
  type VenueCreate,
  type VenueUpdate,
  type VenueStatus,
} from "@bidspace/core";
import { NotFoundError, ValidationError, fromDbError } from "./errors.js";
import { toGeoPoint } from "./geo.js";

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
      description: v.description ?? null,
      address_line_1: v.addressLine1,
      address_line_2: v.addressLine2 ?? null,
      city: v.city,
      state: v.state,
      postal_code: v.postalCode ?? null,
      country: v.country,
      location: toGeoPoint(v.latitude, v.longitude),
      status: "draft" satisfies VenueStatus,
    })
    .select("*")
    .single();
  if (error) throw fromDbError("createVenue", error);
  return data as VenueRow;
}

export async function updateVenue(
  db: BidspaceClient,
  id: string,
  organizationId: string,
  input: VenueUpdate,
): Promise<VenueRow> {
  const parsed = venueUpdateSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError("Invalid venue update", parsed.error.flatten());
  }
  const v = parsed.data;
  const update: Record<string, unknown> = compact({
    name: v.name,
    venue_type: v.venueType,
    description: v.description,
    address_line_1: v.addressLine1,
    address_line_2: v.addressLine2,
    city: v.city,
    state: v.state,
    postal_code: v.postalCode,
    country: v.country,
    status: v.status,
  });
  if (typeof v.latitude === "number" && typeof v.longitude === "number") {
    update.location = toGeoPoint(v.latitude, v.longitude);
  }
  const { data, error } = await db
    .from("venues")
    .update(update)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select("*")
    .maybeSingle();
  if (error) throw fromDbError("updateVenue", error);
  if (!data) throw new NotFoundError("venue", id);
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

function compact(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}
