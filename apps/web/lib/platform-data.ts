import "server-only";
import {
  DOCUMENT_STATUS_PRESENTATION,
  ORGANIZATION_STATUS_PRESENTATION,
  VERIFICATION_STATUS_PRESENTATION,
  getMarketplaceTrustLevel,
  type DocumentStatus,
  type OrganizationMemberRole,
  type OrganizationStatus,
  type VerificationStatus,
} from "@bidspace/core";
import { getCurrentUserOrgContext } from "./auth-context";
import { createServerBidspaceClient } from "./bidspace-server";

type DbRecord = Record<string, unknown>;

export interface ReviewStats {
  count: number;
  averageRating: number | null;
  wouldBookAgainRate: number | null;
}

export interface PlatformData {
  context: Awaited<ReturnType<typeof getCurrentUserOrgContext>>;
  organization: DbRecord | null;
  roleProfiles: DbRecord[];
  venues: DbRecord[];
  opportunities: DbRecord[];
  inventoryUnits: DbRecord[];
  hostBids: DbRecord[];
  bidderBids: DbRecord[];
  bookings: DbRecord[];
  reviewsReceived: DbRecord[];
  reviewsGiven: DbRecord[];
  verifications: DbRecord[];
  documents: DbRecord[];
  adminActions: DbRecord[];
  reviewStats: ReviewStats;
  trustLevel: ReturnType<typeof getMarketplaceTrustLevel>;
  canManageTrust: boolean;
}

export async function getPlatformData(): Promise<PlatformData> {
  const context = await getCurrentUserOrgContext();
  const emptyTrust = getMarketplaceTrustLevel({});

  if (!context?.activeDbOrganizationId) {
    return emptyData(context, emptyTrust);
  }

  const db = createServerBidspaceClient();
  const organizationId = context.activeDbOrganizationId;

  const [
    organizationResult,
    roleProfilesResult,
    venuesResult,
    opportunitiesResult,
    inventoryUnitsResult,
    hostBidsResult,
    bidderBidsResult,
    hostBookingsResult,
    bidderBookingsResult,
    reviewsReceivedResult,
    reviewsGivenResult,
    verificationsResult,
    documentsResult,
    adminActionsResult,
  ] = await Promise.all([
    db.from("organizations").select("*").eq("id", organizationId).maybeSingle(),
    db.from("role_profiles").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }),
    db.from("venues").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }),
    db.from("opportunities").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }),
    db.from("inventory_units").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }),
    db.from("bids").select("*").eq("host_organization_id", organizationId).order("updated_at", { ascending: false }),
    db.from("bids").select("*").eq("bidder_organization_id", organizationId).order("updated_at", { ascending: false }),
    db.from("bookings").select("*").eq("host_organization_id", organizationId).order("updated_at", { ascending: false }),
    db.from("bookings").select("*").eq("bidder_organization_id", organizationId).order("updated_at", { ascending: false }),
    db.from("reviews").select("*").eq("reviewed_organization_id", organizationId).order("created_at", { ascending: false }),
    db.from("reviews").select("*").eq("reviewer_organization_id", organizationId).order("created_at", { ascending: false }),
    db.from("verifications").select("*").eq("subject_id", organizationId).order("updated_at", { ascending: false }),
    db.from("documents").select("*").eq("owner_organization_id", organizationId).order("updated_at", { ascending: false }),
    db.from("admin_actions").select("*").eq("target_id", organizationId).order("created_at", { ascending: false }),
  ]);

  const organization = isRecord(organizationResult.data) ? organizationResult.data : null;
  const roleProfiles = toRecords(roleProfilesResult.data);
  const venues = toRecords(venuesResult.data);
  const opportunities = toRecords(opportunitiesResult.data);
  const inventoryUnits = toRecords(inventoryUnitsResult.data);
  const hostBids = toRecords(hostBidsResult.data);
  const bidderBids = toRecords(bidderBidsResult.data);
  const bookings = [...toRecords(hostBookingsResult.data), ...toRecords(bidderBookingsResult.data)];
  const reviewsReceived = toRecords(reviewsReceivedResult.data);
  const reviewsGiven = toRecords(reviewsGivenResult.data);
  const verifications = toRecords(verificationsResult.data);
  const documents = toRecords(documentsResult.data);
  const adminActions = toRecords(adminActionsResult.data);
  const reviewStats = summarizeReviews(reviewsReceived);

  const trustLevel = getMarketplaceTrustLevel({
    organizationStatus: asOrganizationStatus(text(organization?.status)),
    organizationVerificationStatus: asVerificationStatus(text(organization?.verification_status)),
    verificationStatuses: verifications.map((verification) => asVerificationStatus(text(verification.status))).filter(isNotNull),
    documentStatuses: documents.map((document) => text(document.status)).filter(isDocumentStatus),
    averageRating: reviewStats.averageRating,
    reviewCount: reviewStats.count,
    openAdminActionCount: adminActions.length,
  });

  return {
    context,
    organization,
    roleProfiles,
    venues,
    opportunities,
    inventoryUnits,
    hostBids,
    bidderBids,
    bookings,
    reviewsReceived,
    reviewsGiven,
    verifications,
    documents,
    adminActions,
    reviewStats,
    trustLevel,
    canManageTrust: canManage(context.activeOrganizationRole),
  };
}

export function statusPresentation(status: unknown) {
  const value = text(status);
  if (isVerificationStatus(value)) return VERIFICATION_STATUS_PRESENTATION[value];
  if (isDocumentStatus(value)) return DOCUMENT_STATUS_PRESENTATION[value];
  if (isOrganizationStatus(value)) return ORGANIZATION_STATUS_PRESENTATION[value];
  return { label: humanize(value || "unknown"), tone: "neutral" as const, description: "No status guidance is defined yet." };
}

export function humanize(value: unknown): string {
  return String(value ?? "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function numberValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function formatMoney(cents: unknown): string {
  const value = numberValue(cents);
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value / 100);
}

export function formatDate(value: unknown): string {
  const raw = text(value);
  if (!raw) return "—";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function emptyData(context: PlatformData["context"], trustLevel: PlatformData["trustLevel"]): PlatformData {
  return {
    context,
    organization: null,
    roleProfiles: [],
    venues: [],
    opportunities: [],
    inventoryUnits: [],
    hostBids: [],
    bidderBids: [],
    bookings: [],
    reviewsReceived: [],
    reviewsGiven: [],
    verifications: [],
    documents: [],
    adminActions: [],
    reviewStats: { count: 0, averageRating: null, wouldBookAgainRate: null },
    trustLevel,
    canManageTrust: false,
  };
}

function summarizeReviews(reviews: DbRecord[]): ReviewStats {
  const ratings = reviews.map((review) => numberValue(review.rating)).filter(isNotNull);
  const wouldBookAgainValues = reviews
    .map((review) => review.would_book_again)
    .filter((value): value is boolean => typeof value === "boolean");
  return {
    count: reviews.length,
    averageRating: ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : null,
    wouldBookAgainRate: wouldBookAgainValues.length
      ? wouldBookAgainValues.filter(Boolean).length / wouldBookAgainValues.length
      : null,
  };
}

function canManage(role: OrganizationMemberRole | null | undefined): boolean {
  return role === "owner" || role === "admin" || role === "manager";
}

function toRecords(value: unknown): DbRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function isRecord(value: unknown): value is DbRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asVerificationStatus(value: string): VerificationStatus | null {
  return isVerificationStatus(value) ? value : null;
}

function asOrganizationStatus(value: string): OrganizationStatus | null {
  return isOrganizationStatus(value) ? value : null;
}

function isVerificationStatus(value: string | null): value is VerificationStatus {
  return Boolean(value && value in VERIFICATION_STATUS_PRESENTATION);
}

function isDocumentStatus(value: string): value is DocumentStatus {
  return value in DOCUMENT_STATUS_PRESENTATION;
}

function isOrganizationStatus(value: string | null): value is OrganizationStatus {
  return Boolean(value && value in ORGANIZATION_STATUS_PRESENTATION);
}

function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}
