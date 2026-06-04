// Enum values mirroring packages/db/migrations/0002_enums.sql.
// These are the single source of truth for status/type literals across the app.

export const USER_STATUS = ["invited", "active", "suspended", "deleted"] as const;
export type UserStatus = (typeof USER_STATUS)[number];

export const ORGANIZATION_TYPE = [
  "host",
  "bidder",
  "venue_owner",
  "sponsor",
  "service_provider",
  "network_operator",
  "multi",
] as const;
export type OrganizationType = (typeof ORGANIZATION_TYPE)[number];

export const ORGANIZATION_STATUS = [
  "draft",
  "pending_verification",
  "active",
  "restricted",
  "suspended",
  "archived",
] as const;
export type OrganizationStatus = (typeof ORGANIZATION_STATUS)[number];

export const MARKETPLACE_ROLE_TYPE = [
  "host",
  "bidder",
  "venue_owner",
  "sponsor",
  "service_provider",
  "network_operator",
] as const;
export type MarketplaceRoleType = (typeof MARKETPLACE_ROLE_TYPE)[number];

export const COMMERCE_LAYER = [
  "physical_sales",
  "lead_generation",
  "brand_exposure",
  "experience_activation",
  "operational_service",
] as const;
export type CommerceLayer = (typeof COMMERCE_LAYER)[number];

export const PRICING_MODE = ["fixed", "minimum_bid", "competitive_bid", "hybrid"] as const;
export type PricingMode = (typeof PRICING_MODE)[number];

export const OPPORTUNITY_STATUS = [
  "draft",
  "published",
  "receiving_bids",
  "closed",
  "filled",
  "completed",
  "cancelled",
  "archived",
] as const;
export type OpportunityStatus = (typeof OPPORTUNITY_STATUS)[number];

export const INVENTORY_UNIT_TYPE = [
  "vendor_space",
  "sponsor_asset",
  "service_slot",
  "advertising_placement",
  "temporary_real_estate",
] as const;
export type InventoryUnitType = (typeof INVENTORY_UNIT_TYPE)[number];

export const INVENTORY_UNIT_STATUS = [
  "draft",
  "available",
  "receiving_bids",
  "shortlisted",
  "reserved",
  "payment_pending",
  "booked",
  "completed",
  "cancelled",
  "archived",
] as const;
export type InventoryUnitStatus = (typeof INVENTORY_UNIT_STATUS)[number];

export const BID_STATUS = [
  "draft",
  "submitted",
  "viewed",
  "shortlisted",
  "countered",
  "accepted",
  "rejected",
  "waitlisted",
  "expired",
  "withdrawn",
  "payment_pending",
  "paid",
  "booked",
  "completed",
  "reviewed",
] as const;
export type BidStatus = (typeof BID_STATUS)[number];

export const BOOKING_STATUS = [
  "pending_payment",
  "confirmed",
  "upcoming",
  "in_progress",
  "completed",
  "cancelled",
  "disputed",
  "reviewed",
] as const;
export type BookingStatus = (typeof BOOKING_STATUS)[number];

export const PAYMENT_STATUS = [
  "pending",
  "authorized",
  "paid",
  "failed",
  "refunded",
  "partially_refunded",
  "disputed",
  "paid_out",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[number];

export const VERIFICATION_STATUS = [
  "not_started",
  "pending",
  "verified",
  "rejected",
  "expired",
  "revoked",
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUS)[number];

export const MEMBERSHIP_STATUS = ["active", "invited", "suspended", "removed"] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUS)[number];

// Permission hierarchy: owner > admin > manager > member > viewer.
export const ORGANIZATION_MEMBER_ROLE = ["owner", "admin", "manager", "member", "viewer"] as const;
export type OrganizationMemberRole = (typeof ORGANIZATION_MEMBER_ROLE)[number];

export const REVIEW_STATUS = ["requested", "submitted", "flagged", "published", "hidden"] as const;
export type ReviewStatus = (typeof REVIEW_STATUS)[number];
