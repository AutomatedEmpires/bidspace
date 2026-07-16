import type {
  UserStatus,
  OrganizationType,
  OrganizationStatus,
  OrganizationMemberRole,
  MembershipStatus,
  MarketplaceRoleType,
  RoleProfileStatus,
  VerificationStatus,
  VenueType,
  VenueStatus,
  ZoneType,
  CommerceLayer,
  PricingMode,
  EventType,
  EventStatus,
  OpportunityStatus,
  OpportunityVisibility,
  InventoryUnitType,
  InventoryUnitStatus,
  BidStatus,
  BookingStatus,
  PaymentStatus,
  ReviewStatus,
  DocumentType,
  DocumentStatus,
  VerificationType,
  VerificationSubjectType,
  MessageThreadContext,
  AdminActionType,
  NetworkMemberStatus,
  InvitationStatus,
  ApplicationStatus,
} from "@bidspace/core";
import type { AllocationMode, VendorProfileDetails } from "@bidspace/core";

// Hand-authored row contracts mirroring packages/db/migrations/*.sql.
// These are superseded by `pnpm --filter @bidspace/db gen:types` once a live
// Supabase project exists; until then they give the app real types to build against.
// Money columns are integer cents (bigint in SQL, number in TS) per D020.

export type GeoPoint = { type: "Point"; coordinates: [number, number] };

export interface UserRow {
  id: string;
  auth_provider_id: string | null;
  email: string;
  phone: string | null;
  full_name: string;
  avatar_url: string | null;
  status: UserStatus;
  timezone: string | null;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationRow {
  id: string;
  name: string;
  legal_name: string | null;
  organization_type: OrganizationType;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  phone: string | null;
  email: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  location: GeoPoint | null;
  status: OrganizationStatus;
  verification_status: VerificationStatus;
  stripe_account_id: string | null;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface RoleProfileRow {
  id: string;
  organization_id: string;
  role_type: MarketplaceRoleType;
  display_name: string;
  slug: string | null;
  bio: string | null;
  gallery_urls: string[];
  category_tags: string[];
  commerce_layers: string[];
  service_radius_miles: number | null;
  public_contact_enabled: boolean;
  status: RoleProfileStatus;
  verification_status: VerificationStatus;
  profile_details: VendorProfileDetails;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface OrganizationMembershipRow {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationMemberRole;
  status: MembershipStatus;
  invited_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface VenueRow {
  id: string;
  organization_id: string;
  name: string;
  slug: string | null;
  venue_type: VenueType;
  description: string | null;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  postal_code: string | null;
  country: string;
  location: GeoPoint;
  capacity: number | null;
  parking_info: string | null;
  power_available: boolean | null;
  water_available: boolean | null;
  wifi_available: boolean | null;
  restroom_info: string | null;
  access_instructions: string | null;
  image_urls: string[];
  floorplan_urls: string[];
  status: VenueStatus;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface VenueZoneRow {
  id: string;
  venue_id: string;
  name: string;
  zone_type: ZoneType | null;
  description: string | null;
  center: GeoPoint | null;
  floorplan_x: number | null;
  floorplan_y: number | null;
  visibility_score: number | null;
  traffic_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface EventRow {
  id: string;
  organization_id: string;
  venue_id: string | null;
  name: string;
  slug: string | null;
  event_type: EventType;
  description: string | null;
  starts_at: string;
  ends_at: string;
  timezone: string | null;
  estimated_attendance: number | null;
  attendance_confidence: number | null;
  advertising_channels: string[];
  audience_notes: string | null;
  image_urls: string[];
  status: EventStatus;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface OpportunityRow {
  id: string;
  organization_id: string;
  venue_id: string | null;
  event_id: string | null;
  collection_id: string | null;
  title: string;
  slug: string | null;
  description: string | null;
  status: OpportunityStatus;
  visibility: OpportunityVisibility;
  allocation_mode: AllocationMode;
  pricing_mode: PricingMode;
  commerce_layer: CommerceLayer | null;
  starts_at: string | null;
  ends_at: string | null;
  location: GeoPoint | null;
  audience_profile: string | null;
  estimated_attendance: number | null;
  traffic_confidence: number | null;
  category_tags: string[];
  minimum_bid_cents: number | null;
  bid_deadline: string | null;
  requirements: Record<string, unknown>;
  image_urls: string[];
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface InventoryUnitRow {
  id: string;
  opportunity_id: string;
  organization_id: string;
  venue_id: string | null;
  event_id: string | null;
  zone_id: string | null;
  collection_id: string | null;
  type: InventoryUnitType;
  status: InventoryUnitStatus;
  name: string;
  commerce_layer: CommerceLayer | null;
  pricing_mode: PricingMode;
  minimum_bid_cents: number | null;
  buy_now_price_cents: number | null;
  reserve_price_cents: number | null;
  availability_start: string;
  availability_end: string;
  location: GeoPoint | null;
  floorplan_x: number | null;
  floorplan_y: number | null;
  dimensions: string | null;
  indoor: boolean | null;
  power_available: boolean | null;
  water_available: boolean | null;
  wifi_available: boolean | null;
  vehicle_access: boolean | null;
  setup_window: string | null;
  teardown_window: string | null;
  required_documents: string[];
  category_restrictions: string[];
  outcome_tags: string[];
  visibility_score: number | null;
  traffic_score: number | null;
  notes: string | null;
  image_urls: string[];
  created_at: string;
  updated_at: string;
  archived_at: string | null;
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
  setup_description: string | null;
  category: string | null;
  power_needs: boolean | null;
  water_needs: boolean | null;
  notes: string | null;
  attachments: unknown[];
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
  contract_terms: string | null;
  check_in_status: string | null;
  host_notes: string | null;
  bidder_notes: string | null;
  cancellation_reason: string | null;
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
  failure_reason: string | null;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageThreadRow {
  id: string;
  context: MessageThreadContext;
  bid_id: string | null;
  application_id: string | null;
  booking_id: string | null;
  opportunity_id: string | null;
  created_at: string;
}

export interface MessageRow {
  id: string;
  thread_id: string;
  sender_user_id: string | null;
  sender_organization_id: string | null;
  body: string;
  attachments: unknown[];
  read_at: string | null;
  created_at: string;
}

export interface ReviewRow {
  id: string;
  booking_id: string;
  reviewer_organization_id: string;
  reviewed_organization_id: string;
  status: ReviewStatus;
  rating: number;
  traffic_accuracy_rating: number | null;
  communication_rating: number | null;
  setup_rating: number | null;
  professionalism_rating: number | null;
  written_feedback: string | null;
  would_book_again: boolean | null;
  actual_traffic_feedback: string | null;
  photo_urls: string[];
  created_at: string;
  updated_at: string;
}

export interface DocumentRow {
  id: string;
  owner_organization_id: string;
  file_url: string;
  document_type: DocumentType;
  status: DocumentStatus;
  linked_object_type: string | null;
  linked_object_id: string | null;
  expiration_date: string | null;
  uploaded_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface VerificationRow {
  id: string;
  subject_type: VerificationSubjectType;
  subject_id: string;
  verification_type: VerificationType;
  status: VerificationStatus;
  reviewer_user_id: string | null;
  evidence_document_ids: string[];
  expires_at: string | null;
  risk_score: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminActionRow {
  id: string;
  admin_user_id: string;
  action_type: AdminActionType;
  target_type: string | null;
  target_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface VendorNetworkMemberRow {
  id: string;
  host_organization_id: string;
  vendor_organization_id: string;
  status: NetworkMemberStatus;
  invited_by_user_id: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavedOpportunityRow {
  id: string;
  organization_id: string;
  opportunity_id: string;
  saved_by_user_id: string | null;
  created_at: string;
}

export interface OpportunityInvitationRow {
  id: string;
  opportunity_id: string;
  vendor_organization_id: string;
  invited_by_user_id: string | null;
  message: string | null;
  status: InvitationStatus;
  created_at: string;
  updated_at: string;
}

export interface ApplicationRow {
  id: string;
  vendor_organization_id: string;
  host_organization_id: string;
  opportunity_id: string;
  inventory_unit_id: string | null;
  pitch: string;
  setup_description: string | null;
  space_needs: string | null;
  category: string | null;
  power_needs: boolean | null;
  water_needs: boolean | null;
  attachments: unknown[];
  status: ApplicationStatus;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface StripeWebhookEventRow {
  id: string;
  event_type: string;
  processed_at: string;
}

export interface BidspaceTables {
  users: UserRow;
  organizations: OrganizationRow;
  organization_memberships: OrganizationMembershipRow;
  role_profiles: RoleProfileRow;
  venues: VenueRow;
  venue_zones: VenueZoneRow;
  events: EventRow;
  opportunities: OpportunityRow;
  inventory_units: InventoryUnitRow;
  bids: BidRow;
  bookings: BookingRow;
  payments: PaymentRow;
  message_threads: MessageThreadRow;
  messages: MessageRow;
  reviews: ReviewRow;
  documents: DocumentRow;
  verifications: VerificationRow;
  admin_actions: AdminActionRow;
  vendor_network_members: VendorNetworkMemberRow;
  saved_opportunities: SavedOpportunityRow;
  opportunity_invitations: OpportunityInvitationRow;
  applications: ApplicationRow;
  stripe_webhook_events: StripeWebhookEventRow;
}
