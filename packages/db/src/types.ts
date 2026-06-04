import type {
  UserStatus,
  OrganizationType,
  OrganizationStatus,
  MarketplaceRoleType,
  VerificationStatus,
  CommerceLayer,
  PricingMode,
  OpportunityStatus,
  InventoryUnitType,
  InventoryUnitStatus,
  BidStatus,
  BookingStatus,
  PaymentStatus,
  ReviewStatus,
} from "@bidspace/core";

// Hand-authored row contracts mirroring packages/db/migrations/*.sql.
// These are superseded by `pnpm --filter @bidspace/db gen:types` once a live
// Supabase project exists; until then they give the app real types to build against.

export interface UserRow {
  id: string;
  auth_provider_id: string | null;
  email: string;
  full_name: string;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface OrganizationRow {
  id: string;
  name: string;
  legal_name: string | null;
  organization_type: OrganizationType;
  status: OrganizationStatus;
  verification_status: VerificationStatus;
  stripe_account_id: string | null;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoleProfileRow {
  id: string;
  organization_id: string;
  role_type: MarketplaceRoleType;
  display_name: string;
  slug: string | null;
  bio: string | null;
  category_tags: string[];
  created_at: string;
  updated_at: string;
}

export interface VenueRow {
  id: string;
  organization_id: string;
  name: string;
  venue_type: string;
  address_line1: string;
  city: string;
  state: string;
  // PostGIS geography(Point,4326) is exposed as GeoJSON over the API.
  location: { type: "Point"; coordinates: [number, number] } | null;
  created_at: string;
  updated_at: string;
}

export interface EventRow {
  id: string;
  organization_id: string;
  venue_id: string | null;
  name: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OpportunityRow {
  id: string;
  organization_id: string;
  venue_id: string | null;
  event_id: string | null;
  title: string;
  status: OpportunityStatus;
  pricing_mode: PricingMode;
  commerce_layer: CommerceLayer | null;
  minimum_bid_cents: number | null;
  bid_deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryUnitRow {
  id: string;
  opportunity_id: string;
  organization_id: string;
  type: InventoryUnitType;
  status: InventoryUnitStatus;
  name: string;
  pricing_mode: PricingMode;
  minimum_bid_cents: number | null;
  availability_start: string | null;
  availability_end: string | null;
  location: { type: "Point"; coordinates: [number, number] } | null;
  created_at: string;
  updated_at: string;
}

export interface BidRow {
  id: string;
  bidder_organization_id: string;
  opportunity_id: string;
  inventory_unit_id: string | null;
  status: BidStatus;
  amount_cents: number;
  commerce_layer: CommerceLayer | null;
  intended_use: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingRow {
  id: string;
  bid_id: string | null;
  inventory_unit_id: string;
  bidder_organization_id: string;
  host_organization_id: string;
  status: BookingStatus;
  amount_cents: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentRow {
  id: string;
  booking_id: string;
  status: PaymentStatus;
  amount_cents: number;
  platform_fee_cents: number;
  host_payout_cents: number;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewRow {
  id: string;
  booking_id: string;
  author_organization_id: string;
  subject_organization_id: string;
  status: ReviewStatus;
  rating: number;
  body: string | null;
  created_at: string;
  updated_at: string;
}

export interface BidspaceTables {
  users: UserRow;
  organizations: OrganizationRow;
  role_profiles: RoleProfileRow;
  venues: VenueRow;
  events: EventRow;
  opportunities: OpportunityRow;
  inventory_units: InventoryUnitRow;
  bids: BidRow;
  bookings: BookingRow;
  payments: PaymentRow;
  reviews: ReviewRow;
}
