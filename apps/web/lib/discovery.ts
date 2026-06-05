import { formatMoney, COMMERCE_LAYER, INVENTORY_UNIT_TYPE, type CommerceLayer, type InventoryUnitStatus, type InventoryUnitType } from "@bidspace/core";
import type { InventoryUnitRow } from "@bidspace/db";
import {
  DEFAULT_NEARBY_LIMIT,
  normalizeLimit,
  normalizeRadiusMeters,
  type DiscoveredUnit,
  type NearbyUnitsParams,
} from "@bidspace/services";

export interface DiscoverySearchState {
  params: NearbyUnitsParams | null;
  values: {
    lat: string;
    lng: string;
    radius: string;
    limit: string;
    type: string;
    commerceLayer: string;
  };
  error: string | null;
  hasSearch: boolean;
}

function readSingle(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function parseNumberInput(label: string, raw: string): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${label} must be a valid number.`);
  }
  return parsed;
}

function parseOptionalEnum<T extends readonly string[]>(
  raw: string,
  allowed: T,
  label: string,
): T[number] | undefined {
  if (!raw) {
    return undefined;
  }

  if ((allowed as readonly string[]).includes(raw)) {
    return raw as T[number];
  }

  throw new Error(`${label} must match a supported discovery filter.`);
}

export function resolveDiscoverySearchState(
  searchParams: Record<string, string | string[] | undefined>,
): DiscoverySearchState {
  const values = {
    lat: readSingle(searchParams.lat),
    lng: readSingle(searchParams.lng),
    radius: readSingle(searchParams.radius),
    limit: readSingle(searchParams.limit),
    type: readSingle(searchParams.type),
    commerceLayer: readSingle(searchParams.commerceLayer),
  };

  const hasLocationInput = values.lat.length > 0 || values.lng.length > 0;
  if (!hasLocationInput) {
    return {
      params: null,
      values,
      error: null,
      hasSearch: false,
    };
  }

  if (!values.lat || !values.lng) {
    return {
      params: null,
      values,
      error: "Latitude and longitude are both required to run discovery.",
      hasSearch: true,
    };
  }

  try {
    const latitude = parseNumberInput("Latitude", values.lat);
    const longitude = parseNumberInput("Longitude", values.lng);
    const radiusMeters = values.radius ? normalizeRadiusMeters(parseNumberInput("Radius", values.radius)) : undefined;
    const limit = values.limit
      ? normalizeLimit(parseNumberInput("Limit", values.limit), DEFAULT_NEARBY_LIMIT)
      : undefined;
    const type = parseOptionalEnum(values.type, INVENTORY_UNIT_TYPE, "Type");
    const commerceLayer = parseOptionalEnum(values.commerceLayer, COMMERCE_LAYER, "Commerce layer");

    return {
      params: {
        latitude,
        longitude,
        radiusMeters,
        limit,
        type,
        commerceLayer,
      },
      values,
      error: null,
      hasSearch: true,
    };
  } catch (error) {
    return {
      params: null,
      values,
      error: error instanceof Error ? error.message : "Invalid discovery search parameters.",
      hasSearch: true,
    };
  }
}

function titleize(value: string): string {
  return value
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function formatInventoryUnitStatusLabel(status: InventoryUnitStatus): string {
  return titleize(status);
}

export function formatInventoryUnitTypeLabel(type: InventoryUnitType): string {
  return titleize(type);
}

export function formatCommerceLayerLabel(layer: CommerceLayer): string {
  return titleize(layer);
}

export function formatCurrencyCents(value: number | null): string {
  return value == null ? "Request pricing" : formatMoney(value);
}

export function formatDistanceMiles(distanceMeters: number): string {
  const miles = distanceMeters / 1609.344;
  const rounded = miles >= 10 ? miles.toFixed(0) : miles.toFixed(1);
  return `${rounded} mi away`;
}

export function getDiscoveryHref(unit: Pick<DiscoveredUnit, "id">): string {
  return `/discover/${unit.id}`;
}

export function getInventoryUnitCoordinates(
  unit: Pick<InventoryUnitRow, "location">,
): { latitude: number; longitude: number } | null {
  const coordinates = unit.location?.coordinates;
  if (!coordinates) {
    return null;
  }

  return {
    longitude: coordinates[0],
    latitude: coordinates[1],
  };
}