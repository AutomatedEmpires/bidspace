import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { recordAdminAction } from "@bidspace/services";
import type { DocumentRow, OrganizationRow } from "@bidspace/db";
import {
  Button,
  EmptyState,
  PageHeader,
  Panel,
  PanelBody,
  PanelHeader,
  StatusBadge,
} from "@bidspace/ui";
import { requireAdminUser } from "@/lib/admin-gate";
import { tryGetDb } from "@/lib/safe-db";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Verification queue" };
export const dynamic = "force-dynamic";

async function adminDbUserId(db: NonNullable<ReturnType<typeof tryGetDb>>, clerkUserId: string) {
  const row = (await db.from("users").select("id").eq("auth_provider_id", clerkUserId).maybeSingle()).data;
  return (row as { id: string } | null)?.id ?? null;
}

export default async function AdminVerificationPage() {
  await requireAdminUser();
  const db = tryGetDb();
  if (!db) return <EmptyState icon="warning" title="Marketplace data is not connected" />;

  const pendingOrgs = ((
    await db
      .from("organizations")
      .select("*")
      .in("verification_status", ["pending", "not_started"])
      .eq("status", "pending_verification")
      .order("created_at", { ascending: true })
      .limit(50)
  ).data ?? []) as OrganizationRow[];

  // Also surface orgs that asked for verification via documents.
  const uploadedDocs = ((
    await db
      .from("documents")
      .select("*")
      .in("status", ["uploaded", "pending"])
      .order("created_at", { ascending: true })
      .limit(50)
  ).data ?? []) as DocumentRow[];

  async function verifyOrgAction(formData: FormData) {
    "use server";
    const admin = await requireAdminUser();
    const serverDb = tryGetDb();
    if (!serverDb) return;
    const organizationId = String(formData.get("organizationId") ?? "");
    const decision = String(formData.get("decision") ?? "");
    if (!organizationId || !["verified", "rejected"].includes(decision)) return;
    await serverDb
      .from("organizations")
      .update({
        verification_status: decision,
        status: decision === "verified" ? "active" : "restricted",
      })
      .eq("id", organizationId);
    const adminId = await adminDbUserId(serverDb, admin.id);
    if (adminId) {
      await recordAdminAction(serverDb, {
        adminUserId: adminId,
        actionType: decision === "verified" ? "verify" : "reject_document",
        targetType: "organization",
        targetId: organizationId,
      });
    }
    revalidatePath("/admin/verification");
  }

  async function reviewDocumentAction(formData: FormData) {
    "use server";
    const admin = await requireAdminUser();
    const serverDb = tryGetDb();
    if (!serverDb) return;
    const documentId = String(formData.get("documentId") ?? "");
    const decision = String(formData.get("decision") ?? "");
    if (!documentId || !["verified", "rejected"].includes(decision)) return;
    await serverDb.from("documents").update({ status: decision }).eq("id", documentId);
    const adminId = await adminDbUserId(serverDb, admin.id);
    if (adminId) {
      await recordAdminAction(serverDb, {
        adminUserId: adminId,
        actionType: decision === "verified" ? "verify" : "reject_document",
        targetType: "document",
        targetId: documentId,
      });
    }
    revalidatePath("/admin/verification");
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        kicker="Verification"
        title="Provenance review"
        lede="Verification is earned, never bought. Approve only what the evidence supports."
      />

      <Panel>
        <PanelHeader title={`Organizations (${pendingOrgs.length})`} kicker="Awaiting review" />
        <PanelBody>
          {pendingOrgs.length > 0 ? (
            <ul className="grid gap-3">
              {pendingOrgs.map((org) => (
                <li key={org.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[3px] border border-line px-4 py-3">
                  <div>
                    <p className="font-medium">{org.name}</p>
                    <p className="text-xs text-ink-muted dark:text-canvas-muted">
                      {org.organization_type.replace(/_/g, " ")} · joined {formatDateTime(org.created_at)}
                      {org.website_url ? ` · ${org.website_url}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <form action={verifyOrgAction}>
                      <input type="hidden" name="organizationId" value={org.id} />
                      <input type="hidden" name="decision" value="verified" />
                      <Button type="submit" variant="primary" size="sm">
                        Verify
                      </Button>
                    </form>
                    <form action={verifyOrgAction}>
                      <input type="hidden" name="organizationId" value={org.id} />
                      <input type="hidden" name="decision" value="rejected" />
                      <Button type="submit" variant="ghost" size="sm" className="!text-alert">
                        Reject
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted dark:text-canvas-muted">No organizations waiting.</p>
          )}
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader title={`Documents (${uploadedDocs.length})`} kicker="Insurance, permits, licenses" />
        <PanelBody>
          {uploadedDocs.length > 0 ? (
            <ul className="grid gap-3">
              {uploadedDocs.map((doc) => (
                <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[3px] border border-line px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-medium">{doc.document_type.replace(/_/g, " ")}</p>
                    <p className="truncate text-xs text-ink-muted dark:text-canvas-muted">
                      <a href={doc.file_url} target="_blank" rel="noreferrer" className="underline">
                        {doc.file_url}
                      </a>
                      {doc.expiration_date ? ` · expires ${doc.expiration_date}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={doc.status} />
                    <form action={reviewDocumentAction}>
                      <input type="hidden" name="documentId" value={doc.id} />
                      <input type="hidden" name="decision" value="verified" />
                      <Button type="submit" variant="primary" size="sm">
                        Verify
                      </Button>
                    </form>
                    <form action={reviewDocumentAction}>
                      <input type="hidden" name="documentId" value={doc.id} />
                      <input type="hidden" name="decision" value="rejected" />
                      <Button type="submit" variant="ghost" size="sm" className="!text-alert">
                        Reject
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted dark:text-canvas-muted">No documents waiting.</p>
          )}
        </PanelBody>
      </Panel>
    </div>
  );
}
