import "server-only";

import type {
  CommerceLayer,
  InventoryUnitStatus,
  InventoryUnitType,
  PricingMode,
} from "@bidspace/core";
import type { BidspaceClient, EventRow, InventoryUnitRow, OpportunityRow, OrganizationRow, VenueRow } from "@bidspace/db";
import { searchNearbyUnits, searchUnitsInViewport, type DiscoveredUnit } from "@bidspace/services";
import { createServerBidspaceClient } from "./bidspace-server";
import {
  DEFAULT_RADIUS_CENTER,
  DEFAULT_VIEWPORT,
  type DiscoveryFilters,
  parseDiscoveryFilters,
  radiusMilesToMeters,
  type RawSearchParams,
} from "./discovery-filters";

type JsonArray = string[];

interface InventoryUnitRecord extends InventoryUnitRow {
  commerce_layer: CommerceLayer | null;
  venue_id: string | null;
  event_id: string | null;
  collection_id: string | null;
  dimensions: string | null;
  indoor: boolean | null;
  power_available: boolean | null;
  water_available: boolean | null;
  wifi_available: boolean | null;
  vehicle_access: boolean | null;
  setup_window: string | null;
  teardown_window: string | null;
  required_documents: JsonArray;
  category_restrictions: JsonArray;
  outcome_tags: JsonArray;
  visibility_score: number | null;
  traffic_score: number | null;
  notes: string | null;
  image_urls: JsonArray;
}

interface OpportunityRecord extends OpportunityRow {
  description: string | null;
  starts_at: string | null;
  ends_at: string | null;
  audience_profile: string | null;
  estimated_attendance: number | null;
  traffic_confidence: number | null;
  category_tags: JsonArray;
  image_urls: JsonArray;
}

interface VenueRecord extends VenueRow {
  slug: string | null;
  description: string | null;
  status: string;
  capacity: number | null;
  power_available: boolean | null;
  water_available: boolean | null;
  wifi_available: boolean | null;
  restroom_info: string | null;
  parking_info: string | null;
  image_urls: JsonArray;
}

export interface DiscoveryUnitCard {
  id: string;
  name: string;
  type: InventoryUnitType;
  status: InventoryUnitStatus;
  commerceLayer: CommerceLayer | null;
  pricingMode: PricingMode;
  minimumBidCents: number | null;
  availabilityStart: string;
  availabilityEnd: string;
  latitude: number | null;
  longitude: number | null;
  distanceMeters: number | null;
  opportunityTitle: string | null;
  opportunityDescription: string | null;
  venueName: string | null;
  venueCity: string | null;
  venueState: string | null;
  hostName: string | null;
  outcomeTags: string[];
  categoryRestrictions: string[];
  powerAvailable: boolean | null;
  waterAvailable: boolean | null;
  wifiAvailable: boolean | null;
  vehicleAccess: boolean | null;
}

export interface InventoryUnitDetail extends DiscoveryUnitCard {
  organizationId: string;
  opportunityId: string;
  eventName: string | null;
  eventStartsAt: string | null;
  eventEndsAt: string | null;
  dimensions: string | null;
  indoor: boolean | null;
  setupWindow: string | null;
  teardownWindow: string | null;
  requiredDocuments: string[];
  notes: string | null;
  audienceProfile: string | null;
  estimatedAttendance: number | null;
  venueDescription: string | null;
  venueCapacity: number | null;
}

export interface DiscoveryMapMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: InventoryUnitType;
  commerceLayer: CommerceLayer | null;
  minimumBidCents: number | null;
}

export interface DiscoveryResult {
  filters: DiscoveryFilters;
  units: DiscoveryUnitCard[];
  markers: DiscoveryMapMarker[];
  mode: "viewport" | "radius";
  bounds: {
    minLatitude: number;
    minLongitude: number;
    maxLatitude: number;
    maxLongitude: number;
  };
  center: { latitude: number; longitude: number };
}

function buildUnitCard(
  unit: InventoryUnitRecord,
  discovered: DiscoveredUnit | undefined,
  opportunity: OpportunityRecord | undefined,
  organization: OrganizationRow | undefined,
  venue: VenueRecord | undefined,
): DiscoveryUnitCard {
  const coordinates = unit.location?.coordinates;
  const longitude = discovered?.longitude ?? coordinates?.[0] ?? null;
  const latitude = discovered?.latitude ?? coordinates?.[1] ?? null;

  return {
    id: unit.id,
    name: unit.name,
    type: unit.type,
    status: unit.status,
    commerceLayer: unit.commerce_layer ?? opportunity?.commerce_layer ?? discovered?.commerceLayer ?? null,
    pricingMode: unit.pricing_mode,
    minimumBidCents: unit.minimum_bid_cents ?? opportunity?.minimum_bid_cents ?? discovered?.minimumBidCents ?? null,
    availabilityStart: unit.availability_start,
    availabilityEnd: unit.availability_end,
    latitude,
    longitude,
    distanceMeters: discovered?.distanceMeters ?? null,
    opportunityTitle: opportunity?.title ?? null,
    opportunityDescription: opportunity?.description ?? null,
    venueName: venue?.name ?? null,
    venueCity: venue?.city ?? null,
    venueState: venue?.state ?? null,
    hostName: organization?.name ?? null,
    outcomeTags: unit.outcome_tags ?? [],
    categoryRestrictions: unit.category_restrictions ?? [],
    powerAvailable: unit.power_available,
    waterAvailable: unit.water_available,
    wifiAvailable: unit.wifi_available,
    vehicleAccess: unit.vehicle_access,
  };
}

function searchText(unit: DiscoveryUnitCard): string {
  return [
    unit.name,
    unit.opportunityTitle,
    unit.opportunityDescription,
    unit.venueName,
    unit.venueCity,
    unit.venueState,
    unit.hostName,
    ...unit.outcomeTags,
    ...unit.categoryRestrictions,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function filterByQuery(units: DiscoveryUnitCard[], query: string): DiscoveryUnitCard[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return units;
  return units.filter((unit) => searchText(unit).includes(normalized));
}

function markersFromUnits(units: DiscoveryUnitCard[]): DiscoveryMapMarker[] {
  return units.flatMap((unit) => {
    if (unit.latitude == null || unit.longitude == null) return [];
    return [
      {
        id: unit.id,
        name: unit.name,
        latitude: unit.latitude,
        longitude: unit.longitude,
        type: unit.type,
        commerceLayer: unit.commerceLayer,
        minimumBidCents: unit.minimumBidCents,
      },
    ];
  });
}

async function fetchRowsByIds<T extends { id: string }>(
  db: BidspaceClient,
  table: string,
  ids: string[],
): Promise<Map<string, T>> {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (!uniqueIds.length) return new Map();
  const { data, error } = await db.from(table).select("*").in("id", uniqueIds);
  if (error) throw new Error(`${table} lookup failed: ${error.message}`);
  return new Map(((data ?? []) as T[]).map((row) => [row.id, row]));
}

async function enrichDiscoveredUnits(
  db: BidspaceClient,
  discoveredUnits: DiscoveredUnit[],
): Promise<DiscoveryUnitCard[]> {
  if (!discoveredUnits.length) return [];

  const unitIds = discoveredUnits.map((unit) => unit.id);
  const unitRows = await fetchRowsByIds<InventoryUnitRecord>(db, "inventory_units", unitIds);
  const unitsInDiscoveryOrder = discoveredUnits
    .map((unit) => unitRows.get(unit.id))
    .filter((unit): unit is InventoryUnitRecord => Boolean(unit));

  const opportunities = await fetchRowsByIds<OpportunityRecord>(
    db,
    "opportunities",
    unitsInDiscoveryOrder.map((unit) => unit.opportunity_id),
  );
  const organizations = await fetchRowsByIds<OrganizationRow>(
    db,
    "organizations",
    unitsInDiscoveryOrder.map((unit) => unit.organization_id),
  );
  const venues = await fetchRowsByIds<VenueRecord>(
    db,
    "venues",
    unitsInDiscoveryOrder.map((unit) => unit.venue_id).filter((id): id is string => Boolean(id)),
  );
  const discoveredById = new Map(discoveredUnits.map((unit) => [unit.id, unit]));

  return unitsInDiscoveryOrder.map((unit) =>
    buildUnitCard(
      unit,
      discoveredById.get(unit.id),
      opportunities.get(unit.opportunity_id),
      organizations.get(unit.organization_id),
      unit.venue_id ? venues.get(unit.venue_id) : undefined,
    ),
  );
}

export async function getDiscoveryResult(rawSearchParams: RawSearchParams): Promise<DiscoveryResult> {
  const filters = parseDiscoveryFilters(rawSearchParams);
  const db = createServerBidspaceClient();

  const useRadius = filters.locationMode === "radius";
  const center = {
    latitude: filters.latitude ?? DEFAULT_RADIUS_CENTER.latitude,
    longitude: filters.longitude ?? DEFAULT_RADIUS_CENTER.longitude,
  };
  const bounds = {
    minLatitude: filters.minLatitude ?? DEFAULT_VIEWPORT.minLatitude,
    minLongitude: filters.minLongitude ?? DEFAULT_VIEWPORT.minLongitude,
    maxLatitude: filters.maxLatitude ?? DEFAULT_VIEWPORT.maxLatitude,
    maxLongitude: filters.maxLongitude ?? DEFAULT_VIEWPORT.maxLongitude,
  };

  const discoveredUnits = useRadius
    ? await searchNearbyUnits(db, {
        latitude: center.latitude,
        longitude: center.longitude,
        radiusMeters: radiusMilesToMeters(filters.radiusMiles),
        type: filters.type,
        commerceLayer: filters.commerceLayer,
        limit: filters.limit,
      })
    : await searchUnitsInViewport(db, {
        ...bounds,
        type: filters.type,
        commerceLayer: filters.commerceLayer,
        limit: filters.limit,
      });

  const enrichedUnits = await enrichDiscoveredUnits(db, discoveredUnits);
  const units = filterByQuery(enrichedUnits, filters.q);

  return {
    filters,
    units,
    markers: markersFromUnits(units),
    mode: useRadius ? "radius" : "viewport",
    bounds,
    center: useRadius
      ? center
      : {
          latitude: (bounds.minLatitude + bounds.maxLatitude) / 2,
          longitude: (bounds.minLongitude + bounds.maxLongitude) / 2,
        },
  };
}

export async function getInventoryUnitDetail(id: string): Promise<InventoryUnitDetail | null> {
  const db = createServerBidspaceClient();
  const { data, error } = await db.from("inventory_units").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`inventory unit lookup failed: ${error.message}`);
  if (!data) return null;

  const unit = data as InventoryUnitRecord;
  const [opportunities, organizations, venues, events] = await Promise.all([
    fetchRowsByIds<OpportunityRecord>(db, "opportunities", [unit.opportunity_id]),
    fetchRowsByIds<OrganizationRow>(db, "organizations", [unit.organization_id]),
    fetchRowsByIds<VenueRecord>(db, "venues", unit.venue_id ? [unit.venue_id] : []),
    fetchRowsByIds<EventRow>(db, "events", unit.event_id ? [unit.event_id] : []),
  ]);

  const opportunity = opportunities.get(unit.opportunity_id);
  const organization = organizations.get(unit.organization_id);
  const venue = unit.venue_id ? venues.get(unit.venue_id) : undefined;
  const event = unit.event_id ? events.get(unit.event_id) : undefined;
  const card = buildUnitCard(unit, undefined, opportunity, organization, venue);

  return {
    ...card,
    organizationId: unit.organization_id,
    opportunityId: unit.opportunity_id,
    eventName: event?.name ?? null,
    eventStartsAt: event?.starts_at ?? null,
    eventEndsAt: event?.ends_at ?? null,
    dimensions: unit.dimensions,
    indoor: unit.indoor,
    setupWindow: unit.setup_window,
    teardownWindow: unit.teardown_window,
    requiredDocuments: unit.required_documents ?? [],
    notes: unit.notes,
    audienceProfile: opportunity?.audience_profile ?? null,
    estimatedAttendance: opportunity?.estimated_attendance ?? null,
    venueDescription: venue?.description ?? null,
    venueCapacity: venue?.capacity ?? null,
  };
}
