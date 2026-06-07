import "server-only";
import {
  EVENT_STATUS,
  INVENTORY_UNIT_STATUS,
  OPPORTUNITY_STATUS,
  VENUE_STATUS,
  eventCreateSchema,
  eventUpdateSchema,
  formatMoney,
  inventoryUnitCreateSchema,
  inventoryUnitUpdateSchema,
  opportunityCreateSchema,
  opportunityUpdateSchema,
  toCents,
  venueCreateSchema,
  venueUpdateSchema,
  type InventoryUnitStatus,
  type OpportunityStatus,
  type VenueStatus,
  type EventStatus,
} from "@bidspace/core";
import type { EventRow, InventoryUnitRow, OpportunityRow, VenueRow } from "@bidspace/db";
import { hostDb, type HostWorkspaceContext } from "./host-access";

type DbError = { message?: string };
export interface HostSupplySnapshot { venues: VenueRow[]; events: EventRow[]; opportunities: OpportunityRow[]; inventoryUnits: InventoryUnitRow[]; }

export async function getHostSupplySnapshot(organizationId: string): Promise<HostSupplySnapshot> {
  const db = hostDb();
  const [venues, events, opportunities, inventoryUnits] = await Promise.all([
    db.from("venues").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }),
    db.from("events").select("*").eq("organization_id", organizationId).order("starts_at", { ascending: true }),
    db.from("opportunities").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }),
    db.from("inventory_units").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }),
  ]);
  assertNoDbError("load host venues", venues.error); assertNoDbError("load host events", events.error);
  assertNoDbError("load host opportunities", opportunities.error); assertNoDbError("load host inventory units", inventoryUnits.error);
  return { venues: (venues.data ?? []) as VenueRow[], events: (events.data ?? []) as EventRow[], opportunities: (opportunities.data ?? []) as OpportunityRow[], inventoryUnits: (inventoryUnits.data ?? []) as InventoryUnitRow[] };
}

export function getRelationshipLabel(unit: InventoryUnitRow, opportunities: OpportunityRow[], venues: VenueRow[], events: EventRow[]): string {
  const opportunity = opportunities.find((item) => item.id === unit.opportunity_id);
  const venue = venues.find((item) => item.id === (unit.venue_id ?? opportunity?.venue_id));
  const event = events.find((item) => item.id === (unit.event_id ?? opportunity?.event_id));
  return [opportunity?.title, venue?.name, event?.name].filter(Boolean).join(" · ") || "Unmapped unit";
}
export function formatCents(cents: number | null | undefined): string { return typeof cents === "number" ? formatMoney(cents) : "Not set"; }
export function pretty(value: string | null | undefined): string { return value ? value.replaceAll("_", " ") : "Not set"; }
export function shortDateTime(value: string | null | undefined): string { if (!value) return "Not set"; return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value)); }
export function toInputDateTime(value: string | null | undefined): string { if (!value) return ""; const d = new Date(value); return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 16); }
export function getStatusTone(status: string): string { return status; }

export async function createVenueForHost(context: HostWorkspaceContext, formData: FormData) {
  const v = venueCreateSchema.parse({ organizationId: context.organizationId, name: requiredText(formData, "name"), venueType: requiredText(formData, "venueType"), description: optionalText(formData, "description"), addressLine1: requiredText(formData, "addressLine1"), addressLine2: optionalText(formData, "addressLine2"), city: requiredText(formData, "city"), state: requiredText(formData, "state"), postalCode: optionalText(formData, "postalCode"), country: optionalText(formData, "country") ?? "US", latitude: numberField(formData, "latitude"), longitude: numberField(formData, "longitude") });
  const { error } = await hostDb().from("venues").insert({ organization_id: v.organizationId, name: v.name, venue_type: v.venueType, description: v.description ?? null, address_line_1: v.addressLine1, address_line_2: v.addressLine2 ?? null, city: v.city, state: v.state, postal_code: v.postalCode ?? null, country: v.country, location: toGeoPoint(v.latitude, v.longitude), status: "draft" satisfies VenueStatus });
  assertNoDbError("create venue", error);
}
export async function updateVenueForHost(context: HostWorkspaceContext, formData: FormData) {
  const v = venueUpdateSchema.parse({ name: optionalText(formData, "name"), venueType: optionalText(formData, "venueType"), description: optionalText(formData, "description"), addressLine1: optionalText(formData, "addressLine1"), addressLine2: optionalText(formData, "addressLine2"), city: optionalText(formData, "city"), state: optionalText(formData, "state"), postalCode: optionalText(formData, "postalCode"), country: optionalText(formData, "country"), latitude: optionalNumberField(formData, "latitude"), longitude: optionalNumberField(formData, "longitude"), status: optionalText(formData, "status") });
  const update: Record<string, unknown> = compact({ name: v.name, venue_type: v.venueType, description: v.description, address_line_1: v.addressLine1, address_line_2: v.addressLine2, city: v.city, state: v.state, postal_code: v.postalCode, country: v.country, status: v.status });
  if (typeof v.latitude === "number" && typeof v.longitude === "number") update.location = toGeoPoint(v.latitude, v.longitude);
  const { error } = await hostDb().from("venues").update(update).eq("id", requiredText(formData, "id")).eq("organization_id", context.organizationId); assertNoDbError("update venue", error);
}

export async function createEventForHost(context: HostWorkspaceContext, formData: FormData) {
  const e = eventCreateSchema.parse({ organizationId: context.organizationId, venueId: optionalText(formData, "venueId"), name: requiredText(formData, "name"), eventType: requiredText(formData, "eventType"), description: optionalText(formData, "description"), startsAt: dateTimeField(formData, "startsAt"), endsAt: dateTimeField(formData, "endsAt"), timezone: optionalText(formData, "timezone") ?? "America/Los_Angeles", estimatedAttendance: optionalIntegerField(formData, "estimatedAttendance") });
  const { error } = await hostDb().from("events").insert({ organization_id: e.organizationId, venue_id: e.venueId ?? null, name: e.name, event_type: e.eventType, description: e.description ?? null, starts_at: e.startsAt, ends_at: e.endsAt, timezone: e.timezone ?? null, estimated_attendance: e.estimatedAttendance ?? null, status: "draft" satisfies EventStatus }); assertNoDbError("create event", error);
}
export async function updateEventForHost(context: HostWorkspaceContext, formData: FormData) {
  const e = eventUpdateSchema.parse({ venueId: optionalText(formData, "venueId"), name: optionalText(formData, "name"), eventType: optionalText(formData, "eventType"), description: optionalText(formData, "description"), startsAt: optionalDateTimeField(formData, "startsAt"), endsAt: optionalDateTimeField(formData, "endsAt"), timezone: optionalText(formData, "timezone"), estimatedAttendance: optionalIntegerField(formData, "estimatedAttendance"), status: optionalText(formData, "status") });
  const { error } = await hostDb().from("events").update(compact({ venue_id: e.venueId, name: e.name, event_type: e.eventType, description: e.description, starts_at: e.startsAt, ends_at: e.endsAt, timezone: e.timezone, estimated_attendance: e.estimatedAttendance, status: e.status })).eq("id", requiredText(formData, "id")).eq("organization_id", context.organizationId); assertNoDbError("update event", error);
}

export async function createOpportunityForHost(context: HostWorkspaceContext, formData: FormData) {
  const o = opportunityCreateSchema.parse({ organizationId: context.organizationId, title: requiredText(formData, "title"), description: optionalText(formData, "description"), venueId: optionalText(formData, "venueId"), eventId: optionalText(formData, "eventId"), pricingMode: optionalText(formData, "pricingMode") ?? "hybrid", commerceLayer: optionalText(formData, "commerceLayer"), minimumBidCents: optionalMoneyCents(formData, "minimumBidDollars"), bidDeadline: optionalDateTimeField(formData, "bidDeadline"), startsAt: optionalDateTimeField(formData, "startsAt"), endsAt: optionalDateTimeField(formData, "endsAt") });
  const { error } = await hostDb().from("opportunities").insert({ organization_id: o.organizationId, title: o.title, description: o.description ?? null, venue_id: o.venueId ?? null, event_id: o.eventId ?? null, pricing_mode: o.pricingMode, commerce_layer: o.commerceLayer ?? null, minimum_bid_cents: o.minimumBidCents ?? null, bid_deadline: o.bidDeadline ?? null, starts_at: o.startsAt ?? null, ends_at: o.endsAt ?? null, status: "draft" satisfies OpportunityStatus }); assertNoDbError("create opportunity", error);
}
export async function updateOpportunityForHost(context: HostWorkspaceContext, formData: FormData) { const o = opportunityUpdateSchema.parse({ title: optionalText(formData, "title"), description: optionalText(formData, "description"), venueId: optionalText(formData, "venueId"), eventId: optionalText(formData, "eventId"), pricingMode: optionalText(formData, "pricingMode"), commerceLayer: optionalText(formData, "commerceLayer"), minimumBidCents: optionalMoneyCents(formData, "minimumBidDollars"), bidDeadline: optionalDateTimeField(formData, "bidDeadline"), startsAt: optionalDateTimeField(formData, "startsAt"), endsAt: optionalDateTimeField(formData, "endsAt") }); const { error } = await hostDb().from("opportunities").update(compact({ title: o.title, description: o.description, venue_id: o.venueId, event_id: o.eventId, pricing_mode: o.pricingMode, commerce_layer: o.commerceLayer, minimum_bid_cents: o.minimumBidCents, bid_deadline: o.bidDeadline, starts_at: o.startsAt, ends_at: o.endsAt })).eq("id", requiredText(formData, "id")).eq("organization_id", context.organizationId); assertNoDbError("update opportunity", error); }
export async function transitionOpportunityForHost(context: HostWorkspaceContext, formData: FormData) { const status = requiredText(formData, "status") as OpportunityStatus; if (!OPPORTUNITY_STATUS.includes(status)) throw new Error("Invalid opportunity status"); const { error } = await hostDb().from("opportunities").update({ status }).eq("id", requiredText(formData, "id")).eq("organization_id", context.organizationId); assertNoDbError("transition opportunity", error); }

export async function createInventoryUnitForHost(context: HostWorkspaceContext, formData: FormData) { const u = inventoryUnitCreateSchema.parse({ opportunityId: requiredText(formData, "opportunityId"), organizationId: context.organizationId, venueId: optionalText(formData, "venueId"), eventId: optionalText(formData, "eventId"), type: requiredText(formData, "type"), name: requiredText(formData, "name"), commerceLayer: optionalText(formData, "commerceLayer"), availabilityStart: dateTimeField(formData, "availabilityStart"), availabilityEnd: dateTimeField(formData, "availabilityEnd"), pricingMode: optionalText(formData, "pricingMode") ?? "hybrid", minimumBidCents: optionalMoneyCents(formData, "minimumBidDollars"), buyNowPriceCents: optionalMoneyCents(formData, "buyNowPriceDollars"), reservePriceCents: optionalMoneyCents(formData, "reservePriceDollars"), latitude: optionalNumberField(formData, "latitude"), longitude: optionalNumberField(formData, "longitude"), notes: optionalText(formData, "notes") }); const { error } = await hostDb().from("inventory_units").insert({ opportunity_id: u.opportunityId, organization_id: u.organizationId, venue_id: u.venueId ?? null, event_id: u.eventId ?? null, type: u.type, name: u.name, commerce_layer: u.commerceLayer ?? null, availability_start: u.availabilityStart, availability_end: u.availabilityEnd, pricing_mode: u.pricingMode, minimum_bid_cents: u.minimumBidCents ?? null, buy_now_price_cents: u.buyNowPriceCents ?? null, reserve_price_cents: u.reservePriceCents ?? null, location: toOptionalGeoPoint(u.latitude, u.longitude), notes: u.notes ?? null, status: "draft" satisfies InventoryUnitStatus }); assertNoDbError("create inventory unit", error); }
export async function updateInventoryUnitForHost(context: HostWorkspaceContext, formData: FormData) { const u = inventoryUnitUpdateSchema.parse({ opportunityId: optionalText(formData, "opportunityId"), venueId: optionalText(formData, "venueId"), eventId: optionalText(formData, "eventId"), type: optionalText(formData, "type"), name: optionalText(formData, "name"), commerceLayer: optionalText(formData, "commerceLayer"), availabilityStart: optionalDateTimeField(formData, "availabilityStart"), availabilityEnd: optionalDateTimeField(formData, "availabilityEnd"), pricingMode: optionalText(formData, "pricingMode"), minimumBidCents: optionalMoneyCents(formData, "minimumBidDollars"), buyNowPriceCents: optionalMoneyCents(formData, "buyNowPriceDollars"), reservePriceCents: optionalMoneyCents(formData, "reservePriceDollars"), latitude: optionalNumberField(formData, "latitude"), longitude: optionalNumberField(formData, "longitude"), notes: optionalText(formData, "notes") }); const update: Record<string, unknown> = compact({ opportunity_id: u.opportunityId, venue_id: u.venueId, event_id: u.eventId, type: u.type, name: u.name, commerce_layer: u.commerceLayer, availability_start: u.availabilityStart, availability_end: u.availabilityEnd, pricing_mode: u.pricingMode, minimum_bid_cents: u.minimumBidCents, buy_now_price_cents: u.buyNowPriceCents, reserve_price_cents: u.reservePriceCents, notes: u.notes }); if (typeof u.latitude === "number" && typeof u.longitude === "number") update.location = toGeoPoint(u.latitude, u.longitude); const { error } = await hostDb().from("inventory_units").update(update).eq("id", requiredText(formData, "id")).eq("organization_id", context.organizationId); assertNoDbError("update inventory unit", error); }
export async function transitionInventoryUnitForHost(context: HostWorkspaceContext, formData: FormData) { const status = requiredText(formData, "status") as InventoryUnitStatus; if (!INVENTORY_UNIT_STATUS.includes(status)) throw new Error("Invalid inventory unit status"); const { error } = await hostDb().from("inventory_units").update({ status }).eq("id", requiredText(formData, "id")).eq("organization_id", context.organizationId); assertNoDbError("transition inventory unit", error); }

export const selectableStatuses = { venue: VENUE_STATUS, event: EVENT_STATUS, opportunity: OPPORTUNITY_STATUS, inventoryUnit: INVENTORY_UNIT_STATUS };
function requiredText(formData: FormData, key: string): string { const value = optionalText(formData, key); if (!value) throw new Error(`${key} is required`); return value; }
function optionalText(formData: FormData, key: string): string | undefined { const value = formData.get(key); if (typeof value !== "string") return undefined; const trimmed = value.trim(); return trimmed.length ? trimmed : undefined; }
function numberField(formData: FormData, key: string): number { const value = Number(requiredText(formData, key)); if (!Number.isFinite(value)) throw new Error(`${key} must be a number`); return value; }
function optionalNumberField(formData: FormData, key: string): number | undefined { const raw = optionalText(formData, key); if (!raw) return undefined; const value = Number(raw); if (!Number.isFinite(value)) throw new Error(`${key} must be a number`); return value; }
function optionalIntegerField(formData: FormData, key: string): number | undefined { const value = optionalNumberField(formData, key); return value === undefined ? undefined : Math.trunc(value); }
function dateTimeField(formData: FormData, key: string): string { return new Date(requiredText(formData, key)).toISOString(); }
function optionalDateTimeField(formData: FormData, key: string): string | undefined { const raw = optionalText(formData, key); return raw ? new Date(raw).toISOString() : undefined; }
function optionalMoneyCents(formData: FormData, key: string): number | undefined { const raw = optionalText(formData, key); if (!raw) return undefined; const amount = Number(raw); if (!Number.isFinite(amount) || amount < 0) throw new Error(`${key} must be a non-negative amount`); return toCents(amount); }
function compact(input: Record<string, unknown>): Record<string, unknown> { return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)); }
function toGeoPoint(latitude: number, longitude: number) { return { type: "Point" as const, coordinates: [longitude, latitude] as [number, number] }; }
function toOptionalGeoPoint(latitude: number | undefined, longitude: number | undefined) { return typeof latitude === "number" && typeof longitude === "number" ? toGeoPoint(latitude, longitude) : null; }
function assertNoDbError(operation: string, error: DbError | null) { if (error) throw new Error(`${operation} failed: ${error.message ?? "Unknown database error"}`); }
