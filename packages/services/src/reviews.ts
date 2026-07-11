import type { BidspaceClient, BookingRow, ReviewRow } from "@bidspace/db";
import { reviewCreateSchema, type ReviewCreate } from "@bidspace/core";
import { ValidationError, fromDbError } from "./errors";
import { getBooking } from "./booking";

// --- Pure guards -------------------------------------------------------------
// Reviews are grounded in completed marketplace interactions: only a party to
// a completed (or reviewed) booking may review the counterparty.
export function assertReviewAllowed(
  booking: Pick<BookingRow, "status" | "host_organization_id" | "bidder_organization_id">,
  reviewerOrganizationId: string,
  reviewedOrganizationId: string,
): void {
  if (!["completed", "reviewed"].includes(booking.status)) {
    throw new ValidationError(
      `Reviews require a completed booking (status: ${booking.status})`,
    );
  }
  const parties = [booking.host_organization_id, booking.bidder_organization_id];
  if (!parties.includes(reviewerOrganizationId)) {
    throw new ValidationError("Reviewer is not a party to this booking");
  }
  if (!parties.includes(reviewedOrganizationId)) {
    throw new ValidationError("Reviewed organization is not a party to this booking");
  }
  if (reviewerOrganizationId === reviewedOrganizationId) {
    throw new ValidationError("An organization cannot review itself");
  }
}

export interface ReviewAggregate {
  count: number;
  averageRating: number | null;
  wouldBookAgainRate: number | null;
}

export function aggregateReviews(
  reviews: readonly Pick<ReviewRow, "rating" | "would_book_again" | "status">[],
): ReviewAggregate {
  const published = reviews.filter((r) => r.status === "published" || r.status === "submitted");
  if (published.length === 0) return { count: 0, averageRating: null, wouldBookAgainRate: null };
  const sum = published.reduce((acc, r) => acc + Number(r.rating), 0);
  const answered = published.filter((r) => r.would_book_again !== null);
  const yes = answered.filter((r) => r.would_book_again === true).length;
  return {
    count: published.length,
    averageRating: Math.round((sum / published.length) * 10) / 10,
    wouldBookAgainRate: answered.length ? Math.round((yes / answered.length) * 100) : null,
  };
}

// --- Persistence ---------------------------------------------------------------

export async function submitReview(db: BidspaceClient, input: ReviewCreate): Promise<ReviewRow> {
  const parsed = reviewCreateSchema.safeParse(input);
  if (!parsed.success) throw new ValidationError("Invalid review", parsed.error.flatten());
  const r = parsed.data;
  const booking = await getBooking(db, r.bookingId);
  assertReviewAllowed(booking, r.reviewerOrganizationId, r.reviewedOrganizationId);

  const { data, error } = await db
    .from("reviews")
    .insert({
      booking_id: r.bookingId,
      reviewer_organization_id: r.reviewerOrganizationId,
      reviewed_organization_id: r.reviewedOrganizationId,
      rating: r.rating,
      traffic_accuracy_rating: r.trafficAccuracyRating ?? null,
      communication_rating: r.communicationRating ?? null,
      setup_rating: r.setupRating ?? null,
      professionalism_rating: r.professionalismRating ?? null,
      written_feedback: r.writtenFeedback ?? null,
      would_book_again: r.wouldBookAgain ?? null,
      status: "submitted",
    })
    .select("*")
    .single();
  if (error) throw fromDbError("submitReview", error);
  return data as ReviewRow;
}

export async function listReviewsForOrganization(
  db: BidspaceClient,
  reviewedOrganizationId: string,
): Promise<ReviewRow[]> {
  const { data, error } = await db
    .from("reviews")
    .select("*")
    .eq("reviewed_organization_id", reviewedOrganizationId)
    .in("status", ["submitted", "published"])
    .order("created_at", { ascending: false });
  if (error) throw fromDbError("listReviewsForOrganization", error);
  return (data ?? []) as ReviewRow[];
}
