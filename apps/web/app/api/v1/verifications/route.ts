import { NextResponse } from "next/server";
import { createVerificationRequest } from "@bidspace/services";
import { getCurrentUserOrgContext } from "@/lib/auth-context";
import { createServerBidspaceClient } from "@/lib/bidspace-server";
import { hasOrgRole } from "@/lib/permissions";

export async function POST(request: Request) {
  const context = await getCurrentUserOrgContext();
  if (!context?.activeDbOrganizationId) {
    return NextResponse.json({ error: "An active BidSpace organization is required." }, { status: 401 });
  }
  if (!hasOrgRole("manager", context.activeOrganizationRole)) {
    return NextResponse.json({ error: "Manager access is required to request verification." }, { status: 403 });
  }

  const formData = await request.formData();
  const verification = await createVerificationRequest(createServerBidspaceClient(), {
    subjectType: String(formData.get("subjectType") ?? "organization") as never,
    subjectId: String(formData.get("subjectId") ?? context.activeDbOrganizationId),
    verificationType: String(formData.get("verificationType") ?? "business") as never,
    notes: String(formData.get("notes") ?? "") || undefined,
    evidenceDocumentIds: [],
  });

  return NextResponse.redirect(new URL(`/trust?verification=${verification.id}`, request.url));
}
