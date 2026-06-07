import { NextResponse } from "next/server";
import { reviewCreateSchema } from "@bidspace/core";
import { getCurrentUserOrgContext } from "@/lib/auth-context";
import { createServerBidspaceClient } from "@/lib/bidspace-server";

export async function POST(request: Request) {
  const context = await getCurrentUserOrgContext();
  if (!context?.activeDbOrganizationId) {
    return NextResponse.json({ error: "An active BidSpace organization is required." }, { status: 401 });
  }

  const formData = await request.formData();
  const parsed = reviewCreateSchema.safeParse({
    bookingId: String(formData.get("bookingId") ?? ""),
    reviewerOrganizationId: context.activeDbOrganizationId,
    reviewedOrganizationId: String(formData.get("reviewedOrganizationId") ?? ""),
    rating: Number(formData.get("rating")),
    writtenFeedback: String(formData.get("writtenFeedback") ?? "") || undefined,
    wouldBookAgain: formData.get("wouldBookAgain") === "true",
    photoUrls: [],
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid review input", details: parsed.error.flatten() }, { status: 400 });
  }

  const review = parsed.data;
  const { data, error } = await createServerBidspaceClient()
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
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.redirect(new URL(`/reviews?created=${data.id}`, request.url));
}
