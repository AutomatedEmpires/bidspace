import { z } from "zod";
import {
  ORGANIZATION_TYPE,
  MARKETPLACE_ROLE_TYPE,
  PRICING_MODE,
  COMMERCE_LAYER,
  INVENTORY_UNIT_TYPE,
  VENUE_TYPE,
  EVENT_TYPE,
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

export const opportunityCreateSchema = z.object({
  organizationId: z.string().uuid(),
  title: z.string().min(1),
  venueId: z.string().uuid().optional(),
  eventId: z.string().uuid().optional(),
  pricingMode: z.enum(PRICING_MODE).default("hybrid"),
  commerceLayer: z.enum(COMMERCE_LAYER).optional(),
  minimumBidCents: z.number().int().nonnegative().optional(),
  bidDeadline: z.string().datetime().optional(),
});
export type OpportunityCreate = z.infer<typeof opportunityCreateSchema>;

export const inventoryUnitCreateSchema = z.object({
  opportunityId: z.string().uuid(),
  organizationId: z.string().uuid(),
  type: z.enum(INVENTORY_UNIT_TYPE),
  name: z.string().min(1),
  availabilityStart: z.string().datetime(),
  availabilityEnd: z.string().datetime(),
  pricingMode: z.enum(PRICING_MODE).default("hybrid"),
  minimumBidCents: z.number().int().nonnegative().optional(),
  buyNowPriceCents: z.number().int().nonnegative().optional(),
  reservePriceCents: z.number().int().nonnegative().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});
export type InventoryUnitCreate = z.infer<typeof inventoryUnitCreateSchema>;

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

// --- Update / network-layer schemas ---

export const opportunityUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(8000).optional(),
  audienceProfile: z.string().max(2000).optional(),
  estimatedAttendance: z.number().int().nonnegative().optional(),
  categoryTags: z.array(z.string().min(1).max(60)).max(20).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  visibility: z.enum(["public", "network", "invite_only"]).optional(),
  pricingMode: z.enum(PRICING_MODE).optional(),
  commerceLayer: z.enum(COMMERCE_LAYER).optional(),
  minimumBidCents: z.number().int().nonnegative().nullable().optional(),
  bidDeadline: z.string().datetime().nullable().optional(),
  imageUrls: z.array(z.string().url()).max(12).optional(),
});
export type OpportunityUpdate = z.infer<typeof opportunityUpdateSchema>;

export const inventoryUnitUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  dimensions: z.string().max(120).optional(),
  indoor: z.boolean().optional(),
  powerAvailable: z.boolean().optional(),
  waterAvailable: z.boolean().optional(),
  wifiAvailable: z.boolean().optional(),
  vehicleAccess: z.boolean().optional(),
  setupWindow: z.string().max(300).optional(),
  teardownWindow: z.string().max(300).optional(),
  requiredDocuments: z.array(z.string().min(1).max(60)).max(12).optional(),
  categoryRestrictions: z.array(z.string().min(1).max(60)).max(20).optional(),
  notes: z.string().max(4000).optional(),
  minimumBidCents: z.number().int().nonnegative().nullable().optional(),
  buyNowPriceCents: z.number().int().nonnegative().nullable().optional(),
});
export type InventoryUnitUpdate = z.infer<typeof inventoryUnitUpdateSchema>;

export const venueUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(8000).optional(),
  capacity: z.number().int().nonnegative().optional(),
  parkingInfo: z.string().max(2000).optional(),
  powerAvailable: z.boolean().optional(),
  waterAvailable: z.boolean().optional(),
  wifiAvailable: z.boolean().optional(),
  restroomInfo: z.string().max(2000).optional(),
  accessInstructions: z.string().max(4000).optional(),
  imageUrls: z.array(z.string().url()).max(12).optional(),
});
export type VenueUpdate = z.infer<typeof venueUpdateSchema>;

export const roleProfileUpdateSchema = z.object({
  displayName: z.string().min(1).max(200).optional(),
  slug: slug.optional(),
  bio: z.string().max(4000).optional(),
  categoryTags: z.array(z.string().min(1).max(60)).max(20).optional(),
  galleryUrls: z.array(z.string().url()).max(24).optional(),
  serviceRadiusMiles: z.number().int().positive().max(5000).optional(),
  commerceLayers: z.array(z.enum(COMMERCE_LAYER)).optional(),
});
export type RoleProfileUpdate = z.infer<typeof roleProfileUpdateSchema>;

export const networkInviteSchema = z.object({
  hostOrganizationId: z.string().uuid(),
  vendorOrganizationId: z.string().uuid(),
  note: z.string().max(1000).optional(),
});
export type NetworkInvite = z.infer<typeof networkInviteSchema>;

export const opportunityInviteSchema = z.object({
  opportunityId: z.string().uuid(),
  vendorOrganizationId: z.string().uuid(),
  message: z.string().max(2000).optional(),
});
export type OpportunityInvite = z.infer<typeof opportunityInviteSchema>;

export const messageCreateSchema = z.object({
  threadId: z.string().uuid(),
  senderUserId: z.string().uuid().optional(),
  senderOrganizationId: z.string().uuid(),
  body: z.string().min(1).max(4000),
});
export type MessageCreate = z.infer<typeof messageCreateSchema>;

export const reviewCreateSchema = z.object({
  bookingId: z.string().uuid(),
  reviewerOrganizationId: z.string().uuid(),
  reviewedOrganizationId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  trafficAccuracyRating: z.number().min(1).max(5).optional(),
  communicationRating: z.number().min(1).max(5).optional(),
  setupRating: z.number().min(1).max(5).optional(),
  professionalismRating: z.number().min(1).max(5).optional(),
  writtenFeedback: z.string().max(4000).optional(),
  wouldBookAgain: z.boolean().optional(),
});
export type ReviewCreate = z.infer<typeof reviewCreateSchema>;
