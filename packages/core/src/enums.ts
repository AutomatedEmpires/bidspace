// Enum values mirroring packages/db/migrations/0002_enums.sql.
// These are the single source of truth for status/type literals across the app.
// Order and values MUST match 0002_enums.sql exactly.

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

export const ORGANIZATION_MEMBER_ROLE = [
  "owner",
  "admin",
  "manager",
  "member",
  "viewer",
] as const;
export type OrganizationMemberRole = (typeof ORGANIZATION_MEMBER_ROLE)[number];

export const MARKETPLACE_ROLE_TYPE = [
  "host",
  "bidder",
  "venue_owner",
  "sponsor",
  "service_provider",
  "network_operator",
] as const;
export type MarketplaceRoleType = (typeof MARKETPLACE_ROLE_TYPE)[number];

export const ROLE_PROFILE_STATUS = ["draft", "active", "hidden", "archived"] as const;
export type RoleProfileStatus = (typeof ROLE_PROFILE_STATUS)[number];

export const VENUE_TYPE = [
  "fairgrounds",
  "market",
  "mall",
  "stadium",
  "campus",
  "parking_lot",
  "hall",
  "outdoor",
  "church",
  "school",
  "other",
] as const;
export type VenueType = (typeof VENUE_TYPE)[number];

export const VENUE_STATUS = ["draft", "active", "hidden", "archived"] as const;
export type VenueStatus = (typeof VENUE_STATUS)[number];

export const ZONE_TYPE = [
  "entrance",
  "main_walkway",
  "food_court",
  "premium_corner",
  "indoor_hall",
  "outdoor_row",
  "stage_area",
  "parking_lot",
  "vendor_row",
  "sponsor_area",
  "service_area",
  "back_of_house",
  "low_traffic",
] as const;
export type ZoneType = (typeof ZONE_TYPE)[number];

export const EVENT_TYPE = [
  "fair",
  "festival",
  "market",
  "trade_show",
  "expo",
  "rodeo",
  "concert",
  "convention",
  "community",
  "popup",
  "sporting",
  "other",
] as const;
export type EventType = (typeof EVENT_TYPE)[number];

export const EVENT_STATUS = [
  "draft",
  "published",
  "receiving_bids",
  "closed",
  "completed",
  "cancelled",
  "archived",
] as const;
export type EventStatus = (typeof EVENT_STATUS)[number];

export const COLLECTION_TYPE = [
  "regional",
  "circuit",
  "category",
  "seasonal",
  "network",
  "sponsorship",
] as const;
export type CollectionType = (typeof COLLECTION_TYPE)[number];

export const COLLECTION_STATUS = ["draft", "published", "featured", "archived"] as const;
export type CollectionStatus = (typeof COLLECTION_STATUS)[number];

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

export const REVIEW_STATUS = ["requested", "submitted", "flagged", "published", "hidden"] as const;
export type ReviewStatus = (typeof REVIEW_STATUS)[number];

export const VERIFICATION_TYPE = [
  "identity",
  "business",
  "host",
  "bidder",
  "venue",
  "insurance",
  "license",
  "attendance",
  "network",
] as const;
export type VerificationType = (typeof VERIFICATION_TYPE)[number];

export const VERIFICATION_SUBJECT_TYPE = [
  "organization",
  "user",
  "role_profile",
  "venue",
  "opportunity",
  "inventory_unit",
  "document",
] as const;
export type VerificationSubjectType = (typeof VERIFICATION_SUBJECT_TYPE)[number];

export const DOCUMENT_TYPE = [
  "insurance",
  "business_license",
  "food_permit",
  "fire_inspection",
  "venue_proof",
  "event_proof",
  "attendance_proof",
  "image",
  "floorplan",
  "contract",
  "other",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPE)[number];

export const DOCUMENT_STATUS = [
  "uploaded",
  "pending",
  "verified",
  "rejected",
  "expired",
] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUS)[number];

export const MESSAGE_THREAD_CONTEXT = ["bid", "booking", "opportunity", "support"] as const;
export type MessageThreadContext = (typeof MESSAGE_THREAD_CONTEXT)[number];

export const PERFORMANCE_METRIC_SOURCE = [
  "review",
  "host_report",
  "bidder_report",
  "system",
] as const;
export type PerformanceMetricSource = (typeof PERFORMANCE_METRIC_SOURCE)[number];

export const ADMIN_ACTION_TYPE = [
  "verify",
  "reject_document",
  "suspend",
  "hide_listing",
  "resolve_dispute",
  "issue_refund",
  "flag",
] as const;
export type AdminActionType = (typeof ADMIN_ACTION_TYPE)[number];
