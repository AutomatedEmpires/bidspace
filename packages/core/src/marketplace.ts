export const ALLOCATION_MODE = [
  "bid",
  "application",
  "invite_only",
  "fixed_fee",
  "host_approval",
  "waitlist",
] as const;
export type AllocationMode = (typeof ALLOCATION_MODE)[number];

export const PLACEMENT_STATUS = [
  "draft",
  "invited",
  "submitted",
  "under_review",
  "shortlisted",
  "approved",
  "declined",
  "waitlisted",
  "withdrawn",
  "expired",
] as const;
export type PlacementStatus = (typeof PLACEMENT_STATUS)[number];

export const VERIFICATION_METHOD = [
  "identity",
  "business",
  "venue_control",
  "insurance",
  "permit",
  "attendance_history",
  "completed_placement",
] as const;
export type VerificationMethod = (typeof VERIFICATION_METHOD)[number];

export interface HostProfile {
  organizationId: string;
  displayName: string;
  description?: string;
  venueIds: string[];
  verificationMethods: VerificationMethod[];
  pastVendorIds: string[];
}

export interface VendorProfileDetails {
  setupType?: string;
  spaceNeeds?: string;
  powerNeeds?: string;
  waterNeeds?: string;
  serviceArea?: string;
  availability?: string;
  priorEvents?: string[];
  socialLinks?: string[];
  pitchToHosts?: string;
}

export interface VendorProfile {
  organizationId: string;
  businessName: string;
  productsAndServices?: string;
  details: VendorProfileDetails;
  verificationMethods: VerificationMethod[];
}

export interface EventOrVenue {
  id: string;
  kind: "event" | "venue";
  name: string;
  locationLabel: string;
  expectedTraffic?: number;
  audience?: string;
}

export interface SpaceAvailability {
  startsAt: string;
  endsAt: string;
  setupWindow?: string;
  teardownWindow?: string;
  timezone?: string;
}

export interface SpaceRequirement {
  id: string;
  label: string;
  kind: "document" | "operational" | "category" | "legal";
  required: boolean;
  verificationMethod?: VerificationMethod;
}

export interface Space {
  id: string;
  hostOrganizationId: string;
  eventOrVenueId?: string;
  name: string;
  type: "booth" | "pad" | "stall" | "kiosk" | "pop_up" | "placement" | "other";
  allocationMode: AllocationMode;
  availability: SpaceAvailability[];
  requirements: SpaceRequirement[];
}

export interface Bid {
  id: string;
  spaceId: string;
  vendorOrganizationId: string;
  amountCents: number;
  pitch: string;
  placementStatus: PlacementStatus;
}

export interface Application {
  id: string;
  spaceId: string;
  vendorOrganizationId: string;
  pitch: string;
  setupDescription?: string;
  spaceNeeds?: string;
  powerNeeds?: boolean;
  waterNeeds?: boolean;
  placementStatus: PlacementStatus;
}

export interface Invitation {
  id: string;
  spaceId: string;
  vendorOrganizationId: string;
  message?: string;
  status: "sent" | "viewed" | "accepted" | "declined";
}

export interface MessageThread {
  id: string;
  hostOrganizationId: string;
  vendorOrganizationId: string;
  spaceId?: string;
  placementRequestId?: string;
}

export interface FeePlan {
  id: string;
  name: string;
  status: "dormant" | "test";
  payer: "host";
  listingFeeCents?: number;
  placementFeeBps?: number;
  promotionFeeCents?: number;
}

export const DORMANT_FEE_PLAN: FeePlan = {
  id: "founder-review",
  name: "Founder review",
  status: "dormant",
  payer: "host",
};

