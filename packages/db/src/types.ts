import type {
  UserStatus,
  OrganizationType,
  OrganizationStatus,
  MarketplaceRoleType,
  VerificationStatus,
  VenueType,
  CommerceLayer,
  PricingMode,
  EventType,
  EventStatus,
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
// Money columns are integer cents (bigint in SQL, number in TS) per D020.

export type GeoPoint = { type: "Point"; coordinates: [number, number] };

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
  venue_type: VenueType;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  postal_code: string | null;
  country: string;
  // PostGIS geography(Point,4326) is exposed as GeoJSON over the API.
  location: GeoPoint | null;
  created_at: string;
  updated_at: string;
}

export interface EventRow {
  id: string;
  organization_id: string;
  venue_id: string | null;
  name: string;
  event_type: EventType;
  status: EventStatus;
  starts_at: string;
  ends_at: string;
  timezone: string | null;
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
  buy_now_price_cents: number | null;
  reserve_price_cents: number | null;
  availability_start: string;
  availability_end: string;
  location: GeoPoint | null;
  created_at: string;
  updated_at: string;
}

export interface BidRow {
  id: string;
  bidder_organization_id: string;
  host_organization_id: string | null;
  opportunity_id: string;
  inventory_unit_id: string | null;
  status: BidStatus;
  amount_cents: number;
  counter_amount_cents: number | null;
  commerce_layer: CommerceLayer | null;
  intended_use: string | null;
  expires_at: string | null;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingRow {
  id: string;
  bid_id: string;
  inventory_unit_id: string;
  bidder_organization_id: string;
  host_organization_id: string;
  status: BookingStatus;
  starts_at: string;
  ends_at: string;
  price_cents: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentRow {
  id: string;
  booking_id: string;
  payer_organization_id: string | null;
  payee_organization_id: string | null;
  status: PaymentStatus;
  amount_cents: number;
  currency: string;
  platform_fee_cents: number | null;
  host_payout_cents: number | null;
  refund_cents: number | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewRow {
  id: string;
  booking_id: string;
  reviewer_organization_id: string;
  reviewed_organization_id: string;
  status: ReviewStatus;
  rating: number;
  written_feedback: string | null;
  would_book_again: boolean | null;
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
