import type { BidspaceClient, GeoPoint } from "@bidspace/db";
import type { CommerceLayer, InventoryUnitType, InventoryUnitStatus } from "@bidspace/core";
import { ValidationError, fromDbError } from "./errors.js";

// Phase 5 — spatial discovery (D009: map-first, card-first). Thin, typed
// wrappers over the PostGIS RPCs in 0008_search.sql, plus a non-spatial list
// helper for the /discover list-first browse. Validation guards are pure and
// unit-tested without a database.

export const DEFAULT_SEARCH_RADIUS_M = 50_000;
export const MAX_SEARCH_RADIUS_M = 500_000;
export const MAX_SEARCH_LIMIT = 1000;
export const DEFAULT_NEARBY_LIMIT = 100;
export const DEFAULT_VIEWPORT_LIMIT = 500;
export const DEFAULT_LIST_LIMIT = 120;

const DISCOVERABLE_STATUSES = [
  "available",
  "receiving_bids",
  "shortlisted",
] as const satisfies readonly InventoryUnitStatus[];

export interface DiscoveredUnit {
  id: string;
  opportunityId: string;
  organizationId: string;
  name: string;
  type: InventoryUnitType;
  status: InventoryUnitStatus;
  commerceLayer: CommerceLayer | null;
  minimumBidCents: number | null;
  longitude: number;
  latitude: number;
  distanceMeters: number;
}

export interface NearbyUnitsParams {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  type?: InventoryUnitType;
  commerceLayer?: CommerceLayer;
  limit?: number;
}

export interface ViewportParams {
  minLongitude: number;
  minLatitude: number;
  maxLongitude: number;
  maxLatitude: number;
  type?: InventoryUnitType;
  commerceLayer?: CommerceLayer;
  limit?: number;
}

export interface ListDiscoverableUnitsParams {
  type?: InventoryUnitType;
  commerceLayer?: CommerceLayer;
  limit?: number;
}

// ---- Pure guards -----------------------------------------------------------

export function assertCoordinate(latitude: number, longitude: number): void {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new ValidationError(`Invalid latitude: ${latitude}`);
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new ValidationError(`Invalid longitude: ${longitude}`);
  }
}

export function normalizeRadiusMeters(radiusMeters?: number): number {
  if (radiusMeters == null) return DEFAULT_SEARCH_RADIUS_M;
  if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) {
    throw new ValidationError("radiusMeters must be a positive number");
  }
  return Math.min(radiusMeters, MAX_SEARCH_RADIUS_M);
}

export function normalizeLimit(limit: number | undefined, fallback: number): number {
  if (limit == null) return fallback;
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new ValidationError("limit must be a positive integer");
  }
  return Math.min(limit, MAX_SEARCH_LIMIT);
}

export function assertViewport(p: ViewportParams): void {
  assertCoordinate(p.minLatitude, p.minLongitude);
  assertCoordinate(p.maxLatitude, p.maxLongitude);
  if (p.minLatitude > p.maxLatitude || p.minLongitude > p.maxLongitude) {
    throw new ValidationError("Viewport min bounds must be <= max bounds");
  }
}

// ---- Row mapping -----------------------------------------------------------

interface RpcUnitRow {
  id: string;
  opportunity_id: string;
  organization_id: string;
  name: string;
  type: InventoryUnitType;
  status: InventoryUnitStatus;
  commerce_layer: CommerceLayer | null;
  minimum_bid_cents: number | null;
  longitude: number;
  latitude: number;
  distance_m: number;
}

interface DiscoverableUnitRow {
  id: string;
  opportunity_id: string;
  organization_id: string;
  name: string;
  type: InventoryUnitType;
  status: InventoryUnitStatus;
  commerce_layer: CommerceLayer | null;
  minimum_bid_cents: number | null;
  location: GeoPoint | null;
}

export function mapDiscoveredUnit(r: RpcUnitRow): DiscoveredUnit {
  return {
    id: r.id,
    opportunityId: r.opportunity_id,
    organizationId: r.organization_id,
    name: r.name,
    type: r.type,
    status: r.status,
    commerceLayer: r.commerce_layer,
    minimumBidCents: r.minimum_bid_cents,
    longitude: r.longitude,
    latitude: r.latitude,
    distanceMeters: r.distance_m,
  };
}

function mapDiscoverableUnit(r: DiscoverableUnitRow): DiscoveredUnit | null {
  if (!r.location) return null;
  const [longitude, latitude] = r.location.coordinates;
  return {
    id: r.id,
    opportunityId: r.opportunity_id,
    organizationId: r.organization_id,
    name: r.name,
    type: r.type,
    status: r.status,
    commerceLayer: r.commerce_layer,
    minimumBidCents: r.minimum_bid_cents,
    longitude,
    latitude,
    distanceMeters: 0,
  };
}

// ---- Queries ---------------------------------------------------------------

export async function searchNearbyUnits(
  db: BidspaceClient,
  params: NearbyUnitsParams,
): Promise<DiscoveredUnit[]> {
  assertCoordinate(params.latitude, params.longitude);
  const radius = normalizeRadiusMeters(params.radiusMeters);
  const limit = normalizeLimit(params.limit, DEFAULT_NEARBY_LIMIT);
  const { data, error } = await db.rpc("search_inventory_units", {
    p_lat: params.latitude,
    p_lng: params.longitude,
    p_radius_m: radius,
    p_type: params.type ?? null,
    p_commerce_layer: params.commerceLayer ?? null,
    p_limit: limit,
  });
  if (error) throw fromDbError("searchNearbyUnits", error);
  return ((data ?? []) as RpcUnitRow[]).map(mapDiscoveredUnit);
}

export async function searchUnitsInViewport(
  db: BidspaceClient,
  params: ViewportParams,
): Promise<DiscoveredUnit[]> {
  assertViewport(params);
  const limit = normalizeLimit(params.limit, DEFAULT_VIEWPORT_LIMIT);
  const { data, error } = await db.rpc("search_inventory_units_in_bbox", {
    p_min_lng: params.minLongitude,
    p_min_lat: params.minLatitude,
    p_max_lng: params.maxLongitude,
    p_max_lat: params.maxLatitude,
    p_type: params.type ?? null,
    p_commerce_layer: params.commerceLayer ?? null,
    p_limit: limit,
  });
  if (error) throw fromDbError("searchUnitsInViewport", error);
  return ((data ?? []) as RpcUnitRow[]).map(mapDiscoveredUnit);
}

// Non-spatial browse for the list-first /discover view. Returns the most
// recently updated discoverable, geolocated units so the page is usable even
// without a point or viewport. Distance is 0 (not applicable) for this mode.
export async function listDiscoverableUnits(
  db: BidspaceClient,
  params: ListDiscoverableUnitsParams = {},
): Promise<DiscoveredUnit[]> {
  const limit = normalizeLimit(params.limit, DEFAULT_LIST_LIMIT);
  let query = db
    .from("inventory_units")
    .select(
      "id, opportunity_id, organization_id, name, type, status, commerce_layer, minimum_bid_cents, location",
    )
    .is("archived_at", null)
    .not("location", "is", null)
    .in("status", [...DISCOVERABLE_STATUSES])
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (params.type) query = query.eq("type", params.type);
  if (params.commerceLayer) query = query.eq("commerce_layer", params.commerceLayer);

  const { data, error } = await query;
  if (error) throw fromDbError("listDiscoverableUnits", error);

  return ((data ?? []) as DiscoverableUnitRow[])
    .map(mapDiscoverableUnit)
    .filter((unit): unit is DiscoveredUnit => unit !== null);
}
