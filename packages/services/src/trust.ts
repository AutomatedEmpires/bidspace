import type {
  AdminActionRow,
  BidspaceClient,
  DocumentRow,
  ReviewRow,
  VerificationRow,
} from "@bidspace/db";
import {
  getMarketplaceTrustLevel,
  reviewCreateSchema,
  verificationCreateSchema,
  type MarketplaceTrustLevel,
  type ReviewCreate,
  type VerificationCreate,
  type VerificationSubjectType,
} from "@bidspace/core";
import { NotFoundError, ValidationError, fromDbError } from "./errors.js";

export interface OrganizationTrustSnapshot {
  organizationId: string;
  level: MarketplaceTrustLevel;
  reviewsReceived: ReviewRow[];
  verifications: VerificationRow[];
  documents: DocumentRow[];
  adminActions: AdminActionRow[];
}

export async function createReview(db: BidspaceClient, input: ReviewCreate): Promise<ReviewRow> {
  const parsed = reviewCreateSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError("Invalid review input", parsed.error.flatten());
  }
  const review = parsed.data;
  const { data, error } = await db
    .from("reviews")
    .insert({
      booking_id: review.bookingId,
      reviewer_organization_id: review.reviewerOrganizationId,
      reviewed_organization_id: review.reviewedOrganizationId,
      rating: review.rating,
      traffic_accuracy_rating: review.trafficAccuracyRating ?? null,
      communication_rating: review.communicationRating ?? null,
      setup_rating: review.setupRating ?? null,
      professionalism_rating: review.professionalismRating ?? null,
      written_feedback: review.writtenFeedback ?? null,
      would_book_again: review.wouldBookAgain ?? null,
      actual_traffic_feedback: review.actualTrafficFeedback ?? null,
      photo_urls: review.photoUrls,
      status: "submitted",
    })
    .select("*")
    .single();
  if (error) throw fromDbError("createReview", error);
  return data as ReviewRow;
}

export async function listReviewsForOrganization(
  db: BidspaceClient,
  organizationId: string,
): Promise<ReviewRow[]> {
  const { data, error } = await db
    .from("reviews")
    .select("*")
    .eq("reviewed_organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw fromDbError("listReviewsForOrganization", error);
  return (data ?? []) as ReviewRow[];
}

export async function createVerificationRequest(
  db: BidspaceClient,
  input: VerificationCreate,
): Promise<VerificationRow> {
  const parsed = verificationCreateSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError("Invalid verification input", parsed.error.flatten());
  }
  const verification = parsed.data;
  const { data, error } = await db
    .from("verifications")
    .insert({
      subject_type: verification.subjectType,
      subject_id: verification.subjectId,
      verification_type: verification.verificationType,
      evidence_document_ids: verification.evidenceDocumentIds,
      expires_at: verification.expiresAt ?? null,
      risk_score: verification.riskScore ?? null,
      notes: verification.notes ?? null,
      status: "pending",
    })
    .select("*")
    .single();
  if (error) throw fromDbError("createVerificationRequest", error);
  return data as VerificationRow;
}

export async function listVerificationsForSubject(
  db: BidspaceClient,
  subjectType: VerificationSubjectType,
  subjectId: string,
): Promise<VerificationRow[]> {
  const { data, error } = await db
    .from("verifications")
    .select("*")
    .eq("subject_type", subjectType)
    .eq("subject_id", subjectId)
    .order("updated_at", { ascending: false });
  if (error) throw fromDbError("listVerificationsForSubject", error);
  return (data ?? []) as VerificationRow[];
}

export async function getOrganizationTrustSnapshot(
  db: BidspaceClient,
  organizationId: string,
): Promise<OrganizationTrustSnapshot> {
  const { data: organization, error: organizationError } = await db
    .from("organizations")
    .select("id, status, verification_status")
    .eq("id", organizationId)
    .maybeSingle();
  if (organizationError) throw fromDbError("getOrganizationTrustSnapshot.organization", organizationError);
  if (!organization) throw new NotFoundError("organization", organizationId);

  const [reviewsResult, verificationsResult, documentsResult, adminActionsResult] = await Promise.all([
    db.from("reviews").select("*").eq("reviewed_organization_id", organizationId),
    db.from("verifications").select("*").eq("subject_id", organizationId),
    db.from("documents").select("*").eq("owner_organization_id", organizationId),
    db.from("admin_actions").select("*").eq("target_id", organizationId),
  ]);

  if (reviewsResult.error) throw fromDbError("getOrganizationTrustSnapshot.reviews", reviewsResult.error);
  if (verificationsResult.error) throw fromDbError("getOrganizationTrustSnapshot.verifications", verificationsResult.error);
  if (documentsResult.error) throw fromDbError("getOrganizationTrustSnapshot.documents", documentsResult.error);
  if (adminActionsResult.error) throw fromDbError("getOrganizationTrustSnapshot.adminActions", adminActionsResult.error);

  const reviewsReceived = (reviewsResult.data ?? []) as ReviewRow[];
  const ratingTotal = reviewsReceived.reduce((sum, review) => sum + Number(review.rating), 0);
  const averageRating = reviewsReceived.length ? ratingTotal / reviewsReceived.length : null;
  const typedVerifications = (verificationsResult.data ?? []) as VerificationRow[];
  const typedDocuments = (documentsResult.data ?? []) as DocumentRow[];
  const typedAdminActions = (adminActionsResult.data ?? []) as AdminActionRow[];

  return {
    organizationId,
    level: getMarketplaceTrustLevel({
      organizationStatus: String(organization.status) as never,
      organizationVerificationStatus: String(organization.verification_status) as never,
      verificationStatuses: typedVerifications.map((verification) => verification.status),
      documentStatuses: typedDocuments.map((document) => document.status),
      averageRating,
      reviewCount: reviewsReceived.length,
      openAdminActionCount: typedAdminActions.length,
    }),
    reviewsReceived,
    verifications: typedVerifications,
    documents: typedDocuments,
    adminActions: typedAdminActions,
  };
}
