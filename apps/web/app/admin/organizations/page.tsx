import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { recordAdminAction } from "@bidspace/services";
import type { OrganizationRow } from "@bidspace/db";
import { Button, EmptyState, PageHeader, StatusBadge, Table, TBody, TD, TH, THead } from "@bidspace/ui";
import { requireAdminUser } from "@/lib/admin-gate";
import { tryGetDb } from "@/lib/safe-db";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Organizations" };
export const dynamic = "force-dynamic";

export default async function AdminOrganizationsPage() {
  await requireAdminUser();
  const db = tryGetDb();
  if (!db) return <EmptyState icon="warning" title="Marketplace data is not connected" />;

  const organizations = ((
    await db.from("organizations").select("*").order("created_at", { ascending: false }).limit(100)
  ).data ?? []) as OrganizationRow[];

  async function moderateAction(formData: FormData) {
    "use server";
    const admin = await requireAdminUser();
    const serverDb = tryGetDb();
    if (!serverDb) return;
    const organizationId = String(formData.get("organizationId") ?? "");
    const status = String(formData.get("status") ?? "");
    if (!organizationId || !["active", "suspended"].includes(status)) return;
    await serverDb.from("organizations").update({ status }).eq("id", organizationId);
    const adminUser = (
      await serverDb.from("users").select("id").eq("auth_provider_id", admin.id).maybeSingle()
    ).data as { id: string } | null;
    if (adminUser) {
      await recordAdminAction(serverDb, {
        adminUserId: adminUser.id,
        actionType: status === "suspended" ? "suspend" : "verify",
        targetType: "organization",
        targetId: organizationId,
        notes: `status -> ${status}`,
      });
    }
    revalidatePath("/admin/organizations");
  }

  return (
    <div className="grid gap-8">
      <PageHeader kicker="Organizations" title="Marketplace participants" />
      {organizations.length > 0 ? (
        <Table>
          <THead>
            <tr>
              <TH>Organization</TH>
              <TH>Type</TH>
              <TH>Joined</TH>
              <TH>Verification</TH>
              <TH>Status</TH>
              <TH />
            </tr>
          </THead>
          <TBody>
            {organizations.map((org) => (
              <tr key={org.id}>
                <TD className="font-medium">{org.name}</TD>
                <TD className="text-ink-muted dark:text-canvas-muted">
                  {org.organization_type.replace(/_/g, " ")}
                </TD>
                <TD>{formatDate(org.created_at)}</TD>
                <TD>
                  <StatusBadge status={org.verification_status} />
                </TD>
                <TD>
                  <StatusBadge status={org.status} />
                </TD>
                <TD>
                  <div className="flex justify-end gap-1.5">
                    {org.status !== "suspended" ? (
                      <form action={moderateAction}>
                        <input type="hidden" name="organizationId" value={org.id} />
                        <input type="hidden" name="status" value="suspended" />
                        <Button type="submit" variant="ghost" size="sm" className="!text-alert">
                          Suspend
                        </Button>
                      </form>
                    ) : (
                      <form action={moderateAction}>
                        <input type="hidden" name="organizationId" value={org.id} />
                        <input type="hidden" name="status" value="active" />
                        <Button type="submit" variant="secondary" size="sm">
                          Restore
                        </Button>
                      </form>
                    )}
                  </div>
                </TD>
              </tr>
            ))}
          </TBody>
        </Table>
      ) : (
        <EmptyState icon="venue" title="No organizations yet" />
      )}
    </div>
  );
}
