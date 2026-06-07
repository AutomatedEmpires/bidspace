import { NextResponse } from "next/server";
import { createReview } from "@bidspace/services";
import { getCurrentUserOrgContext } from "@/lib/auth-context";
import { createServerBidspaceClient } from "@/lib/bidspace-server";

export async function POST(request: Request) {
  const context = await getCurrentUserOrgContext();
  if (!context?.activeDbOrganizationId) {
    return NextResponse.json({ error: "An active BidSpace organization is required." }, { status: 401 });
  }

  const formData = await request.formData();
  const rating = Number(formData.get("rating"));
  const wouldBookAgain = formData.get("wouldBookAgain") === "true";

  const review = await createReview(createServerBidspaceClient(), {
    bookingId: String(formData.get("bookingId") ?? ""),
    reviewerOrganizationId: context.activeDbOrganizationId,
    reviewedOrganizationId: String(formData.get("reviewedOrganizationId") ?? ""),
    rating,
    writtenFeedback: String(formData.get("writtenFeedback") ?? "") || undefined,
    wouldBookAgain,
    photoUrls: [],
  });

  return NextResponse.redirect(new URL(`/reviews?created=${review.id}`, request.url));
}
