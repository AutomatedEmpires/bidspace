import type {
  BidspaceClient,
  DocumentRow,
  OrganizationRow,
  VerificationRow,
} from "@bidspace/db";
import type { DocumentType } from "@bidspace/core";
import { fromDbError } from "./errors";

// --- Trust provenance ----------------------------------------------------------
// No single meaningless "verified" badge: each signal names WHY it is known.
export interface TrustSignal {
  key: string;
  label: string;
  earned: boolean;
  detail: string;
}

export function buildTrustSignals(input: {
  organization: Pick<OrganizationRow, "verification_status" | "stripe_account_id" | "created_at">;
  completedBookings: number;
  reviewCount: number;
  currentDocuments: readonly Pick<DocumentRow, "document_type" | "status" | "expiration_date">[];
  now?: Date;
}): TrustSignal[] {
  const now = input.now ?? new Date();
  const activeDoc = (type: DocumentType) =>
    input.currentDocuments.some(
      (d) =>
        d.document_type === type &&
        d.status === "verified" &&
        (!d.expiration_date || new Date(d.expiration_date) > now),
    );

  return [
    {
      key: "organization",
      label: "Organization confirmed",
      earned: input.organization.verification_status === "verified",
      detail:
        input.organization.verification_status === "verified"
          ? "Business identity reviewed by BidSpace"
          : "Business identity not yet reviewed",
    },
    {
      key: "payments",
      label: "Payment account ready",
      earned: Boolean(input.organization.stripe_account_id),
      detail: input.organization.stripe_account_id
        ? "Connected payout account on file"
        : "No connected payout account yet",
    },
    {
      key: "insurance",
      label: "Insurance current",
      earned: activeDoc("insurance"),
      detail: activeDoc("insurance")
        ? "Certificate of insurance verified and unexpired"
        : "No current verified certificate of insurance",
    },
    {
      key: "history",
      label: "Marketplace history",
      earned: input.completedBookings > 0,
      detail:
        input.completedBookings > 0
          ? `${input.completedBookings} completed booking${input.completedBookings === 1 ? "" : "s"}, ${input.reviewCount} review${input.reviewCount === 1 ? "" : "s"}`
          : "No completed bookings yet",
    },
  ];
}

// --- Documents -------------------------------------------------------------------

export async function listDocumentsForOrganization(
  db: BidspaceClient,
  ownerOrganizationId: string,
): Promise<DocumentRow[]> {
  const { data, error } = await db
    .from("documents")
    .select("*")
    .eq("owner_organization_id", ownerOrganizationId)
    .order("created_at", { ascending: false });
  if (error) throw fromDbError("listDocumentsForOrganization", error);
  return (data ?? []) as DocumentRow[];
}

export async function addDocument(
  db: BidspaceClient,
  input: {
    ownerOrganizationId: string;
    fileUrl: string;
    documentType: DocumentType;
    expirationDate?: string;
    uploadedByUserId?: string;
  },
): Promise<DocumentRow> {
  const { data, error } = await db
    .from("documents")
    .insert({
      owner_organization_id: input.ownerOrganizationId,
      file_url: input.fileUrl,
      document_type: input.documentType,
      expiration_date: input.expirationDate ?? null,
      uploaded_by_user_id: input.uploadedByUserId ?? null,
      status: "uploaded",
    })
    .select("*")
    .single();
  if (error) throw fromDbError("addDocument", error);
  return data as DocumentRow;
}

// --- Verifications ------------------------------------------------------------------

export async function listVerificationsForSubject(
  db: BidspaceClient,
  subjectType: VerificationRow["subject_type"],
  subjectId: string,
): Promise<VerificationRow[]> {
  const { data, error } = await db
    .from("verifications")
    .select("*")
    .eq("subject_type", subjectType)
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: false });
  if (error) throw fromDbError("listVerificationsForSubject", error);
  return (data ?? []) as VerificationRow[];
}
