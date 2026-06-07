import "server-only";

import { COMMERCE_LAYER, INVENTORY_UNIT_TYPE } from "@bidspace/core";
import type {
  CommerceLayer,
  InventoryUnitStatus,
  InventoryUnitType,
  PricingMode,
} from "@bidspace/core";
import type { BidspaceClient, GeoPoint } from "@bidspace/db";
import {
  DEFAULT_SEARCH_RADIUS_M,
  MAX_SEARCH_RADIUS_M,
  searchNearbyUnits,
  searchUnitsInViewport,
} from "@bidspace/services";
import type { DiscoveredUnit } from "@bidspace/services";
import { createServerBidspaceClient } from "./bidspace-server";

// Server-only discovery surface helper (D009: map-first, card-first; D001:
// inventory-unit-first). This is the single data boundary for the /discover
// browse experience and the inventory-unit detail page so route components stay
// thin. Every loader is route-safe: if Supabase env is missing (e.g. preview
// builds without secrets) it degrades to a typed status instead of throwing.

export const LOCATION_MODES = ["anywhere", "near", "viewport"] as const;
export type LocationMode = (typeof LOCATION_MODES)[number];

export const DEFAULT_DISCOVERY_LIMIT = 60;
export const MAX_DISCOVERY_LIMIT = 120;

// Geographic centre of the contiguous US — a sensible default map focus when
// the bidder has not supplied a point or viewport yet.
const DEFAULT_CENTER = { latitude: 39.8283, longitude: -98.5795 } as const;

const DISCOVERABLE_STATUSES = [
  "available",
  "receiving_bids",
  "shortlisted",
] as const satisfies readonly InventoryUnitStatus[];

export type DiscoveryStatus = "ok" | "empty" | "configuration_error" | "error";
export type UnitDetailStatus =
  | "ok"
  | "not_found"
  | "configuration_error"
  | "error";

export interface Viewport {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

export interface DiscoveryQuery {
  search?: string;
  unitType?: InventoryUnitType;
  commerceLayer?: CommerceLayer;
  locationMode: LocationMode;
  latitude?: number;
  longitude?: number;
  radiusMeters: number;
  viewport?: Viewport;
  limit: number;
}

export interface MapCenter {
  latitude: number;
  longitude: number;
}

export interface DiscoveryMapPoint {
  id: string;
  href: string;
  name: string;
  latitude: number;
  longitude: number;
  unitType: InventoryUnitType;
  unitTypeLabel: string;
  priceLabel: string;
}

export interface DiscoveryUnitCard {
  id: string;
  href: string;
  name: string;
  unitType: InventoryUnitType;
  unitTypeLabel: string;
  commerceLayer: CommerceLayer | null;
  commerceLayerLabel: string | null;
  status: InventoryUnitStatus;
  statusLabel: string;
  pricingMode: PricingMode;
  minimumBidCents: number | null;
  buyNowPriceCents: number | null;
  priceLabel: string;
  distanceMeters: number | null;
  distanceLabel: string | null;
  opportunityTitle: string | null;
  hostName: string | null;
  venueLabel: string | null;
  dateRangeLabel: string | null;
  audienceProfile: string | null;
  estimatedAttendance: number | null;
  categoryTags: string[];
  outcomeTags: string[];
  amenities: string[];
  imageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface DiscoveryUnitDetail extends DiscoveryUnitCard {
  description: string | null;
  opportunityDescription: string | null;
  reservePriceCents: number | null;
  availabilityStart: string | null;
  availabilityEnd: string | null;
  dimensions: string | null;
  setupWindow: string | null;
  teardownWindow: string | null;
  notes: string | null;
  requiredDocuments: string[];
  categoryRestrictions: string[];
  hostType: string | null;
  venueName: string | null;
  venueType: string | null;
  locationLabel: string | null;
  images: string[];
  isBiddable: boolean;
}

export interface DiscoveryResults {
  status: DiscoveryStatus;
  message?: string;
  cards: DiscoveryUnitCard[];
  points: DiscoveryMapPoint[];
  total: number;
  center: MapCenter;
  query: DiscoveryQuery;
}

export interface UnitDetailResult {
  status: UnitDetailStatus;
  message?: string;
  unit?: DiscoveryUnitDetail;
}

// ---- Formatting helpers ----------------------------------------------------

export function labelize(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .split(/[_\s]+/)
    .filter((part) => part.length > 0)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatMoney(cents: number | null | undefined): string | null {
  if (cents == null || !Number.isFinite(cents)) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function formatDistance(meters: number | null | undefined): string | null {
  if (meters == null || !Number.isFinite(meters)) return null;
  const miles = meters / 1609.344;
  if (miles < 0.1) return `${Math.round(meters)} m away`;
  return `${miles.toFixed(miles < 10 ? 1 : 0)} mi away`;
}

function formatDay(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
): string | null {
  const startLabel = start ? formatDay(start) : null;
  const endLabel = end ? formatDay(end) : null;
  if (startLabel && endLabel) {
    return startLabel === endLabel ? startLabel : `${startLabel} \u2013 ${endLabel}`;
  }
  return startLabel ?? endLabel;
}

export function defaultMapCenter(): MapCenter {
  return { latitude: DEFAULT_CENTER.latitude, longitude: DEFAULT_CENTER.longitude };
}

// ---- Param parsing ---------------------------------------------------------

type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseFloatOrUndefined(value: string | undefined): number | undefined {
  if (value == null || value.trim() === "") return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseUnitType(value: string | undefined): InventoryUnitType | undefined {
  return INVENTORY_UNIT_TYPE.find((entry) => entry === value);
}

function parseCommerceLayer(value: string | undefined): CommerceLayer | undefined {
  return COMMERCE_LAYER.find((entry) => entry === value);
}

function parseLocationMode(value: string | undefined): LocationMode {
  return LOCATION_MODES.find((entry) => entry === value) ?? "anywhere";
}

export function parseDiscoverySearchParams(params: RawSearchParams): DiscoveryQuery {
  const search = first(params.q)?.trim();
  const unitType = parseUnitType(first(params.type));
  const commerceLayer = parseCommerceLayer(first(params.layer));
  const locationMode = parseLocationMode(first(params.mode));

  const latitude = parseFloatOrUndefined(first(params.lat));
  const longitude = parseFloatOrUndefined(first(params.lng));

  const radiusRaw = parseFloatOrUndefined(first(params.radius));
  const radiusMeters = radiusRaw == null
    ? DEFAULT_SEARCH_RADIUS_M
    : Math.min(Math.max(Math.round(radiusRaw), 1), MAX_SEARCH_RADIUS_M);

  const minLng = parseFloatOrUndefined(first(params.minLng));
  const minLat = parseFloatOrUndefined(first(params.minLat));
  const maxLng = parseFloatOrUndefined(first(params.maxLng));
  const maxLat = parseFloatOrUndefined(first(params.maxLat));
  const viewport =
    minLng != null && minLat != null && maxLng != null && maxLat != null
      ? { minLng, minLat, maxLng, maxLat }
      : undefined;

  const limitRaw = parseFloatOrUndefined(first(params.limit));
  const limit = limitRaw == null
    ? DEFAULT_DISCOVERY_LIMIT
    : Math.min(Math.max(Math.round(limitRaw), 1), MAX_DISCOVERY_LIMIT);

  return {
    search: search && search.length > 0 ? search : undefined,
    unitType,
    commerceLayer,
    locationMode,
    latitude,
    longitude,
    radiusMeters,
    viewport,
    limit,
  };
}

// ---- Row hydration ---------------------------------------------------------

const UNIT_SELECT = `
  id, type, name, status, commerce_layer, pricing_mode,
  minimum_bid_cents, buy_now_price_cents, reserve_price_cents,
  availability_start, availability_end, location,
  dimensions, indoor, power_available, water_available, wifi_available, vehicle_access,
  setup_window, teardown_window,
  required_documents, category_restrictions, outcome_tags,
  visibility_score, traffic_score, notes, image_urls,
  opportunity_id, organization_id, venue_id,
  opportunity:opportunity_id ( id, title, slug, description, starts_at, ends_at, audience_profile, estimated_attendance, category_tags, image_urls ),
  venue:venue_id ( id, name, venue_type, city, state, country, location ),
  organization:organization_id ( id, name, organization_type )
`;

interface RawOpportunity {
  id: string;
  title: string | null;
  slug: string | null;
  description: string | null;
  starts_at: string | null;
  ends_at: string | null;
  audience_profile: string | null;
  estimated_attendance: number | null;
  category_tags: string[] | null;
  image_urls: string[] | null;
}

interface RawVenue {
  id: string;
  name: string | null;
  venue_type: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  location: GeoPoint | null;
}

interface RawOrganization {
  id: string;
  name: string | null;
  organization_type: string | null;
}

interface RawUnitRow {
  id: string;
  type: InventoryUnitType;
  name: string;
  status: InventoryUnitStatus;
  commerce_layer: CommerceLayer | null;
  pricing_mode: PricingMode;
  minimum_bid_cents: number | null;
  buy_now_price_cents: number | null;
  reserve_price_cents: number | null;
  availability_start: string | null;
  availability_end: string | null;
  location: GeoPoint | null;
  dimensions: string | null;
  indoor: boolean | null;
  power_available: boolean | null;
  water_available: boolean | null;
  wifi_available: boolean | null;
  vehicle_access: boolean | null;
  setup_window: string | null;
  teardown_window: string | null;
  required_documents: string[] | null;
  category_restrictions: string[] | null;
  outcome_tags: string[] | null;
  visibility_score: number | null;
  traffic_score: number | null;
  notes: string | null;
  image_urls: string[] | null;
  opportunity_id: string;
  organization_id: string;
  venue_id: string | null;
  opportunity: RawOpportunity | RawOpportunity[] | null;
  venue: RawVenue | RawVenue[] | null;
  organization: RawOrganization | RawOrganization[] | null;
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function cleanStrings(value: string[] | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
}

function pointFromLocation(
  location: GeoPoint | null | undefined,
): MapCenter | null {
  if (!location || !Array.isArray(location.coordinates)) return null;
  const longitude = location.coordinates[0];
  const latitude = location.coordinates[1];
  if (typeof longitude !== "number" || typeof latitude !== "number") return null;
  return { latitude, longitude };
}

function venueLabelFrom(venue: RawVenue | null): string | null {
  if (!venue) return null;
  const cityState = [venue.city, venue.state].filter(
    (part): part is string => typeof part === "string" && part.length > 0,
  );
  if (cityState.length > 0) return cityState.join(", ");
  if (venue.country) return venue.country;
  return venue.name ?? null;
}

function amenitiesFrom(row: RawUnitRow): string[] {
  const amenities: string[] = [];
  if (row.indoor === true) amenities.push("Indoor");
  if (row.indoor === false) amenities.push("Outdoor");
  if (row.power_available) amenities.push("Power");
  if (row.water_available) amenities.push("Water");
  if (row.wifi_available) amenities.push("Wi-Fi");
  if (row.vehicle_access) amenities.push("Vehicle access");
  return amenities;
}

function priceLabelFrom(row: RawUnitRow): string {
  const minBid = formatMoney(row.minimum_bid_cents);
  if (minBid) return `Min bid ${minBid}`;
  const buyNow = formatMoney(row.buy_now_price_cents);
  if (buyNow) return `Buy now ${buyNow}`;
  return "Open to offers";
}

function toCard(row: RawUnitRow, distanceMeters: number | null): DiscoveryUnitCard {
  const opportunity = one(row.opportunity);
  const venue = one(row.venue);
  const organization = one(row.organization);
  const images = cleanStrings(row.image_urls);
  const opportunityImages = cleanStrings(opportunity?.image_urls);
  const point = pointFromLocation(row.location);

  return {
    id: row.id,
    href: `/inventory-units/${row.id}`,
    name: row.name,
    unitType: row.type,
    unitTypeLabel: labelize(row.type),
    commerceLayer: row.commerce_layer,
    commerceLayerLabel: row.commerce_layer ? labelize(row.commerce_layer) : null,
    status: row.status,
    statusLabel: labelize(row.status),
    pricingMode: row.pricing_mode,
    minimumBidCents: row.minimum_bid_cents,
    buyNowPriceCents: row.buy_now_price_cents,
    priceLabel: priceLabelFrom(row),
    distanceMeters,
    distanceLabel: formatDistance(distanceMeters),
    opportunityTitle: opportunity?.title ?? null,
    hostName: organization?.name ?? null,
    venueLabel: venueLabelFrom(venue),
    dateRangeLabel: formatDateRange(
      opportunity?.starts_at ?? row.availability_start,
      opportunity?.ends_at ?? row.availability_end,
    ),
    audienceProfile: opportunity?.audience_profile ?? null,
    estimatedAttendance: opportunity?.estimated_attendance ?? null,
    categoryTags: cleanStrings(opportunity?.category_tags),
    outcomeTags: cleanStrings(row.outcome_tags),
    amenities: amenitiesFrom(row),
    imageUrl: images[0] ?? opportunityImages[0] ?? null,
    latitude: point?.latitude ?? null,
    longitude: point?.longitude ?? null,
  };
}

function toDetail(row: RawUnitRow): DiscoveryUnitDetail {
  const opportunity = one(row.opportunity);
  const venue = one(row.venue);
  const organization = one(row.organization);
  const base = toCard(row, null);
  const images = cleanStrings(row.image_urls);
  const opportunityImages = cleanStrings(opportunity?.image_urls);

  return {
    ...base,
    description: row.notes ?? null,
    opportunityDescription: opportunity?.description ?? null,
    reservePriceCents: row.reserve_price_cents,
    availabilityStart: row.availability_start,
    availabilityEnd: row.availability_end,
    dimensions: row.dimensions,
    setupWindow: row.setup_window,
    teardownWindow: row.teardown_window,
    notes: row.notes,
    requiredDocuments: cleanStrings(row.required_documents),
    categoryRestrictions: cleanStrings(row.category_restrictions),
    hostType: organization?.organization_type ? labelize(organization.organization_type) : null,
    venueName: venue?.name ?? null,
    venueType: venue?.venue_type ? labelize(venue.venue_type) : null,
    locationLabel: venueLabelFrom(venue),
    images: images.length > 0 ? images : opportunityImages,
    isBiddable: (DISCOVERABLE_STATUSES as readonly string[]).includes(row.status),
  };
}

function toMapPoint(card: DiscoveryUnitCard): DiscoveryMapPoint | null {
  if (card.latitude == null || card.longitude == null) return null;
  return {
    id: card.id,
    href: card.href,
    name: card.name,
    latitude: card.latitude,
    longitude: card.longitude,
    unitType: card.unitType,
    unitTypeLabel: card.unitTypeLabel,
    priceLabel: card.priceLabel,
  };
}

// ---- Queries ---------------------------------------------------------------

async function browseUnits(
  client: BidspaceClient,
  query: DiscoveryQuery,
): Promise<DiscoveryUnitCard[]> {
  let builder = client
    .from("inventory_units")
    .select(UNIT_SELECT)
    .is("archived_at", null)
    .in("status", [...DISCOVERABLE_STATUSES])
    .order("updated_at", { ascending: false })
    .limit(query.limit);

  if (query.unitType) builder = builder.eq("type", query.unitType);
  if (query.commerceLayer) builder = builder.eq("commerce_layer", query.commerceLayer);
  if (query.search) builder = builder.ilike("name", `%${query.search}%`);

  const { data, error } = await builder;
  if (error) throw new Error(error.message);
  return ((data ?? []) as RawUnitRow[]).map((row) => toCard(row, null));
}

async function hydrateInDistanceOrder(
  client: BidspaceClient,
  found: DiscoveredUnit[],
): Promise<DiscoveryUnitCard[]> {
  if (found.length === 0) return [];
  const ids = found.map((unit) => unit.id);
  const distanceById = new Map(found.map((unit) => [unit.id, unit.distanceMeters]));

  const { data, error } = await client
    .from("inventory_units")
    .select(UNIT_SELECT)
    .in("id", ids);
  if (error) throw new Error(error.message);

  const rowById = new Map(((data ?? []) as RawUnitRow[]).map((row) => [row.id, row]));
  const cards: DiscoveryUnitCard[] = [];
  for (const unit of found) {
    const row = rowById.get(unit.id);
    if (!row) continue;
    cards.push(toCard(row, distanceById.get(unit.id) ?? null));
  }
  return cards;
}

function resolveCenter(query: DiscoveryQuery, cards: DiscoveryUnitCard[]): MapCenter {
  if (
    query.locationMode === "near" &&
    query.latitude != null &&
    query.longitude != null
  ) {
    return { latitude: query.latitude, longitude: query.longitude };
  }
  if (query.locationMode === "viewport" && query.viewport) {
    return {
      latitude: (query.viewport.minLat + query.viewport.maxLat) / 2,
      longitude: (query.viewport.minLng + query.viewport.maxLng) / 2,
    };
  }
  const firstWithPoint = cards.find(
    (card) => card.latitude != null && card.longitude != null,
  );
  if (firstWithPoint && firstWithPoint.latitude != null && firstWithPoint.longitude != null) {
    return { latitude: firstWithPoint.latitude, longitude: firstWithPoint.longitude };
  }
  return defaultMapCenter();
}

export async function loadDiscoveryResults(
  query: DiscoveryQuery,
): Promise<DiscoveryResults> {
  let client: BidspaceClient;
  try {
    client = createServerBidspaceClient();
  } catch {
    return {
      status: "configuration_error",
      message:
        "Discovery is not connected to a data source yet. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to browse live inventory.",
      cards: [],
      points: [],
      total: 0,
      center: defaultMapCenter(),
      query,
    };
  }

  try {
    let cards: DiscoveryUnitCard[];
    if (
      query.locationMode === "near" &&
      query.latitude != null &&
      query.longitude != null
    ) {
      const found = await searchNearbyUnits(client, {
        latitude: query.latitude,
        longitude: query.longitude,
        radiusMeters: query.radiusMeters,
        type: query.unitType,
        commerceLayer: query.commerceLayer,
        limit: query.limit,
      });
      cards = await hydrateInDistanceOrder(client, found);
    } else if (query.locationMode === "viewport" && query.viewport) {
      const found = await searchUnitsInViewport(client, {
        minLongitude: query.viewport.minLng,
        minLatitude: query.viewport.minLat,
        maxLongitude: query.viewport.maxLng,
        maxLatitude: query.viewport.maxLat,
        type: query.unitType,
        commerceLayer: query.commerceLayer,
        limit: query.limit,
      });
      cards = await hydrateInDistanceOrder(client, found);
    } else {
      cards = await browseUnits(client, query);
    }

    const points = cards
      .map(toMapPoint)
      .filter((point): point is DiscoveryMapPoint => point !== null);

    return {
      status: cards.length > 0 ? "ok" : "empty",
      cards,
      points,
      total: cards.length,
      center: resolveCenter(query, cards),
      query,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to load discovery results.",
      cards: [],
      points: [],
      total: 0,
      center: defaultMapCenter(),
      query,
    };
  }
}

export async function loadInventoryUnitDetail(id: string): Promise<UnitDetailResult> {
  let client: BidspaceClient;
  try {
    client = createServerBidspaceClient();
  } catch {
    return {
      status: "configuration_error",
      message:
        "This listing is not connected to a data source yet. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to view live inventory.",
    };
  }

  try {
    const { data, error } = await client
      .from("inventory_units")
      .select(UNIT_SELECT)
      .eq("id", id)
      .is("archived_at", null)
      .maybeSingle();
    if (error) return { status: "error", message: error.message };
    if (!data) return { status: "not_found" };
    return { status: "ok", unit: toDetail(data as RawUnitRow) };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to load this listing.",
    };
  }
}
