import {
  COMMERCE_LAYER,
  INVENTORY_UNIT_TYPE,
  type CommerceLayer,
  type InventoryUnitType,
} from "@bidspace/core";

export const UNIT_TYPE_LABELS: Record<InventoryUnitType, string> = {
  vendor_space: "Vendor space",
  sponsor_asset: "Sponsor asset",
  service_slot: "Service slot",
  advertising_placement: "Advertising placement",
  temporary_real_estate: "Temporary real estate",
};

export const COMMERCE_LAYER_LABELS: Record<CommerceLayer, string> = {
  physical_sales: "Physical sales",
  lead_generation: "Lead generation",
  brand_exposure: "Brand exposure",
  experience_activation: "Experience activation",
  operational_service: "Operational service",
};

export const LOCATION_MODES = ["viewport", "radius"] as const;
export type LocationMode = (typeof LOCATION_MODES)[number];

export interface DiscoveryFilters {
  q: string;
  type?: InventoryUnitType;
  commerceLayer?: CommerceLayer;
  locationMode: LocationMode;
  latitude?: number;
  longitude?: number;
  radiusMiles: number;
  minLatitude?: number;
  minLongitude?: number;
  maxLatitude?: number;
  maxLongitude?: number;
  limit: number;
}

export type RawSearchParams = Record<string, string | string[] | undefined>;

export const DEFAULT_DISCOVERY_LIMIT = 60;
export const DEFAULT_RADIUS_MILES = 50;
export const DEFAULT_VIEWPORT = {
  minLatitude: 24.396308,
  minLongitude: -124.848974,
  maxLatitude: 49.384358,
  maxLongitude: -66.885444,
};
export const DEFAULT_RADIUS_CENTER = {
  latitude: 39.8283,
  longitude: -98.5795,
};

const MILES_TO_METERS = 1609.344;

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function numberValue(value: string | string[] | undefined): number | undefined {
  const raw = firstValue(value);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function textValue(value: string | string[] | undefined): string {
  return firstValue(value)?.trim() ?? "";
}

function isInventoryUnitType(value: string | undefined): value is InventoryUnitType {
  return !!value && (INVENTORY_UNIT_TYPE as readonly string[]).includes(value);
}

function isCommerceLayer(value: string | undefined): value is CommerceLayer {
  return !!value && (COMMERCE_LAYER as readonly string[]).includes(value);
}

function isLocationMode(value: string | undefined): value is LocationMode {
  return !!value && (LOCATION_MODES as readonly string[]).includes(value);
}

function positiveInteger(value: number | undefined, fallback: number): number {
  if (!value || value < 1) return fallback;
  return Math.min(Math.floor(value), 500);
}

export function parseDiscoveryFilters(searchParams: RawSearchParams = {}): DiscoveryFilters {
  const mode = firstValue(searchParams.mode ?? searchParams.locationMode);
  const type = firstValue(searchParams.type);
  const commerceLayer = firstValue(searchParams.commerceLayer ?? searchParams.layer);
  const radiusMiles = numberValue(searchParams.radiusMiles ?? searchParams.radius);

  return {
    q: textValue(searchParams.q ?? searchParams.search),
    type: isInventoryUnitType(type) ? type : undefined,
    commerceLayer: isCommerceLayer(commerceLayer) ? commerceLayer : undefined,
    locationMode: isLocationMode(mode) ? mode : "viewport",
    latitude: numberValue(searchParams.lat ?? searchParams.latitude),
    longitude: numberValue(searchParams.lng ?? searchParams.longitude),
    radiusMiles: Math.min(Math.max(radiusMiles ?? DEFAULT_RADIUS_MILES, 1), 310),
    minLatitude: numberValue(searchParams.minLat ?? searchParams.minLatitude ?? searchParams.south),
    minLongitude: numberValue(searchParams.minLng ?? searchParams.minLongitude ?? searchParams.west),
    maxLatitude: numberValue(searchParams.maxLat ?? searchParams.maxLatitude ?? searchParams.north),
    maxLongitude: numberValue(searchParams.maxLng ?? searchParams.maxLongitude ?? searchParams.east),
    limit: positiveInteger(numberValue(searchParams.limit), DEFAULT_DISCOVERY_LIMIT),
  };
}

export function radiusMilesToMeters(radiusMiles: number): number {
  return Math.round(radiusMiles * MILES_TO_METERS);
}

export function formatMoney(cents: number | null | undefined): string {
  if (cents == null) return "Sealed bid: no public floor";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatEnumLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatDistance(meters: number | null | undefined): string {
  if (meters == null || !Number.isFinite(meters)) return "Map-ready";
  const miles = meters / MILES_TO_METERS;
  if (miles < 0.1) return "<0.1 mi";
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles).toLocaleString("en-US")} mi`;
}
