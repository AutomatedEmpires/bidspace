import { z } from "zod";
import {
  ORGANIZATION_TYPE,
  MARKETPLACE_ROLE_TYPE,
  PRICING_MODE,
  COMMERCE_LAYER,
  INVENTORY_UNIT_TYPE,
  VENUE_TYPE,
  EVENT_TYPE,
  VENUE_STATUS,
  EVENT_STATUS,
  OPPORTUNITY_STATUS,
  INVENTORY_UNIT_STATUS,
} from "./enums";

const slug = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9-]+$/, "slug must be lowercase alphanumeric with dashes");

export const organizationCreateSchema = z.object({
  name: z.string().min(1).max(200),
  organizationType: z.enum(ORGANIZATION_TYPE),
  legalName: z.string().max(200).optional(),
  description: z.string().optional(),
  websiteUrl: z.string().url().optional(),
  email: z.string().email().optional(),
});
export type OrganizationCreate = z.infer<typeof organizationCreateSchema>;

export const roleProfileCreateSchema = z.object({
  organizationId: z.string().uuid(),
  roleType: z.enum(MARKETPLACE_ROLE_TYPE),
  displayName: z.string().min(1).max(200),
  slug: slug.optional(),
  bio: z.string().optional(),
  categoryTags: z.array(z.string()).default([]),
});
export type RoleProfileCreate = z.infer<typeof roleProfileCreateSchema>;

export const venueCreateSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1),
  venueType: z.enum(VENUE_TYPE),
  description: z.string().optional(),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().optional(),
  country: z.string().min(2).max(2).default("US"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
export type VenueCreate = z.infer<typeof venueCreateSchema>;

export const venueUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  venueType: z.enum(VENUE_TYPE).optional(),
  description: z.string().optional(),
  addressLine1: z.string().min(1).optional(),
  addressLine2: z.string().optional(),
  city: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  postalCode: z.string().optional(),
  country: z.string().min(2).max(2).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  status: z.enum(VENUE_STATUS).optional(),
});
export type VenueUpdate = z.infer<typeof venueUpdateSchema>;

export const eventCreateSchema = z
  .object({
    organizationId: z.string().uuid(),
    venueId: z.string().uuid().optional(),
    name: z.string().min(1),
    eventType: z.enum(EVENT_TYPE),
    description: z.string().optional(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    timezone: z.string().optional(),
    estimatedAttendance: z.number().int().nonnegative().optional(),
  })
  .refine((v) => v.endsAt >= v.startsAt, {
    message: "endsAt must be on or after startsAt",
    path: ["endsAt"],
  });
export type EventCreate = z.infer<typeof eventCreateSchema>;

export const eventUpdateSchema = z
  .object({
    venueId: z.string().uuid().optional(),
    name: z.string().min(1).optional(),
    eventType: z.enum(EVENT_TYPE).optional(),
    description: z.string().optional(),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional(),
    timezone: z.string().optional(),
    estimatedAttendance: z.number().int().nonnegative().optional(),
    status: z.enum(EVENT_STATUS).optional(),
  })
  .refine((v) => !v.startsAt || !v.endsAt || v.endsAt >= v.startsAt, {
    message: "endsAt must be on or after startsAt",
    path: ["endsAt"],
  });
export type EventUpdate = z.infer<typeof eventUpdateSchema>;

export const opportunityCreateSchema = z
  .object({
    organizationId: z.string().uuid(),
    title: z.string().min(1),
    description: z.string().optional(),
    venueId: z.string().uuid().optional(),
    eventId: z.string().uuid().optional(),
    pricingMode: z.enum(PRICING_MODE).default("hybrid"),
    commerceLayer: z.enum(COMMERCE_LAYER).optional(),
    minimumBidCents: z.number().int().nonnegative().optional(),
    bidDeadline: z.string().datetime().optional(),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional(),
  })
  .refine((v) => !v.startsAt || !v.endsAt || v.endsAt >= v.startsAt, {
    message: "endsAt must be on or after startsAt",
    path: ["endsAt"],
  });
export type OpportunityCreate = z.infer<typeof opportunityCreateSchema>;

export const opportunityUpdateSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    venueId: z.string().uuid().optional(),
    eventId: z.string().uuid().optional(),
    pricingMode: z.enum(PRICING_MODE).optional(),
    commerceLayer: z.enum(COMMERCE_LAYER).optional(),
    minimumBidCents: z.number().int().nonnegative().optional(),
    bidDeadline: z.string().datetime().optional(),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional(),
    status: z.enum(OPPORTUNITY_STATUS).optional(),
  })
  .refine((v) => !v.startsAt || !v.endsAt || v.endsAt >= v.startsAt, {
    message: "endsAt must be on or after startsAt",
    path: ["endsAt"],
  });
export type OpportunityUpdate = z.infer<typeof opportunityUpdateSchema>;

export const inventoryUnitCreateSchema = z
  .object({
    opportunityId: z.string().uuid(),
    organizationId: z.string().uuid(),
    venueId: z.string().uuid().optional(),
    eventId: z.string().uuid().optional(),
    type: z.enum(INVENTORY_UNIT_TYPE),
    name: z.string().min(1),
    commerceLayer: z.enum(COMMERCE_LAYER).optional(),
    availabilityStart: z.string().datetime(),
    availabilityEnd: z.string().datetime(),
    pricingMode: z.enum(PRICING_MODE).default("hybrid"),
    minimumBidCents: z.number().int().nonnegative().optional(),
    buyNowPriceCents: z.number().int().nonnegative().optional(),
    reservePriceCents: z.number().int().nonnegative().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    notes: z.string().optional(),
  })
  .refine((v) => v.availabilityEnd >= v.availabilityStart, {
    message: "availabilityEnd must be on or after availabilityStart",
    path: ["availabilityEnd"],
  });
export type InventoryUnitCreate = z.infer<typeof inventoryUnitCreateSchema>;

export const inventoryUnitUpdateSchema = z
  .object({
    opportunityId: z.string().uuid().optional(),
    venueId: z.string().uuid().optional(),
    eventId: z.string().uuid().optional(),
    type: z.enum(INVENTORY_UNIT_TYPE).optional(),
    name: z.string().min(1).optional(),
    commerceLayer: z.enum(COMMERCE_LAYER).optional(),
    availabilityStart: z.string().datetime().optional(),
    availabilityEnd: z.string().datetime().optional(),
    pricingMode: z.enum(PRICING_MODE).optional(),
    minimumBidCents: z.number().int().nonnegative().optional(),
    buyNowPriceCents: z.number().int().nonnegative().optional(),
    reservePriceCents: z.number().int().nonnegative().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    notes: z.string().optional(),
    status: z.enum(INVENTORY_UNIT_STATUS).optional(),
  })
  .refine((v) => !v.availabilityStart || !v.availabilityEnd || v.availabilityEnd >= v.availabilityStart, {
    message: "availabilityEnd must be on or after availabilityStart",
    path: ["availabilityEnd"],
  });
export type InventoryUnitUpdate = z.infer<typeof inventoryUnitUpdateSchema>;

export const bidPreferenceSchema = z.object({
  inventoryUnitId: z.string().uuid().optional(),
  rank: z.number().int().positive(),
  amountCents: z.number().int().positive().optional(),
  criteria: z.record(z.string(), z.unknown()).optional(),
});
export type BidPreferenceInput = z.infer<typeof bidPreferenceSchema>;

export const bidCreateSchema = z.object({
  bidderOrganizationId: z.string().uuid(),
  opportunityId: z.string().uuid(),
  inventoryUnitId: z.string().uuid().optional(),
  amountCents: z.number().int().positive(),
  commerceLayer: z.enum(COMMERCE_LAYER).optional(),
  intendedUse: z.string().optional(),
  preferences: z.array(bidPreferenceSchema).optional(),
});
export type BidCreate = z.infer<typeof bidCreateSchema>;
