import type { BidspaceClient } from "@bidspace/db";
import type { CommerceLayer, InventoryUnitType, InventoryUnitStatus } from "@bidspace/core";
import { ValidationError, fromDbError } from "./errors";

// Phase 5 — spatial discovery (D009: map-first, card-first). Thin, typed
// wrappers over the PostGIS RPCs in 0008_search.sql. Validation guards are pure
// and unit-tested without a database.

export const DEFAULT_SEARCH_RADIUS_M = 50_000;
export const MAX_SEARCH_RADIUS_M = 500_000;
export const MAX_SEARCH_LIMIT = 1000;
export const DEFAULT_NEARBY_LIMIT = 100;
export const DEFAULT_VIEWPORT_LIMIT = 500;

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
