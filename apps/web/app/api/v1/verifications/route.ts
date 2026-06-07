import { NextResponse } from "next/server";
import { verificationCreateSchema } from "@bidspace/core";
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
  const parsed = verificationCreateSchema.safeParse({
    subjectType: String(formData.get("subjectType") ?? "organization"),
    subjectId: String(formData.get("subjectId") ?? context.activeDbOrganizationId),
    verificationType: String(formData.get("verificationType") ?? "business"),
    notes: String(formData.get("notes") ?? "") || undefined,
    evidenceDocumentIds: [],
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid verification input", details: parsed.error.flatten() }, { status: 400 });
  }

  const verification = parsed.data;
  const { data, error } = await createServerBidspaceClient()
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
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.redirect(new URL(`/trust?verification=${data.id}`, request.url));
}
