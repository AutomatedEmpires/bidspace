import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import {
  ServiceError,
  inviteVendorToNetwork,
  listNetworkForHost,
  setNetworkMemberStatus,
} from "@bidspace/services";
import type { OrganizationRow, RoleProfileRow } from "@bidspace/db";
import {
  Button,
  EmptyState,
  Field,
  Icon,
  Input,
  PageHeader,
  Panel,
  PanelBody,
  PanelHeader,
  Select,
  StatusBadge,
} from "@bidspace/ui";
import { requireHostContext } from "@/lib/org-context";
import { tryGetDb } from "@/lib/safe-db";
import { captureServerEvent } from "@/lib/analytics-server";

export const metadata: Metadata = { title: "Vendor network" };
export const dynamic = "force-dynamic";

export default async function HostNetworkPage() {
  const context = await requireHostContext();
  const db = tryGetDb();
  if (!db) return <EmptyState icon="warning" title="Marketplace data is not connected" />;

  const orgId = context.activeDbOrganizationId;
  const members = await listNetworkForHost(db, orgId);

  // Candidates: organizations with a vendor-side role profile, not yet in the network.
  const vendorProfiles = ((
    await db
      .from("role_profiles")
      .select("organization_id, display_name, role_type, category_tags")
      .in("role_type", ["bidder", "sponsor", "service_provider"])
      .limit(200)
  ).data ?? []) as Pick<RoleProfileRow, "organization_id" | "display_name" | "role_type" | "category_tags">[];
  const memberIds = new Set(members.map((m) => m.vendor_organization_id));
  const candidates = vendorProfiles.filter(
    (p) => p.organization_id !== orgId && !memberIds.has(p.organization_id),
  );

  const memberOrgIds = members.map((m) => m.vendor_organization_id);
  const memberOrgs =
    memberOrgIds.length > 0
      ? (((await db.from("organizations").select("id, name, verification_status").in("id", memberOrgIds)).data ??
          []) as Pick<OrganizationRow, "id" | "name" | "verification_status">[])
      : [];

  async function inviteAction(formData: FormData) {
    "use server";
    const current = await requireHostContext();
    const serverDb = tryGetDb();
    if (!serverDb) return;
    const vendorOrganizationId = String(formData.get("vendorOrganizationId") ?? "");
    if (!vendorOrganizationId) return;
    try {
      await inviteVendorToNetwork(serverDb, {
        hostOrganizationId: current.activeDbOrganizationId,
        vendorOrganizationId,
        note: String(formData.get("note") ?? "").trim() || undefined,
      });
      captureServerEvent("network_invited", current.activeDbOrganizationId, {
        vendor_organization_id: vendorOrganizationId,
      });
    } catch (error) {
      if (!(error instanceof ServiceError)) throw error;
    }
    revalidatePath("/host/network");
  }

  async function statusAction(formData: FormData) {
    "use server";
    const current = await requireHostContext();
    const serverDb = tryGetDb();
    if (!serverDb) return;
    const memberId = String(formData.get("memberId") ?? "");
    const status = String(formData.get("status") ?? "");
    if (!["active", "removed"].includes(status)) return;
    try {
      const rows = await listNetworkForHost(serverDb, current.activeDbOrganizationId);
      if (!rows.some((m) => m.id === memberId)) return;
      await setNetworkMemberStatus(serverDb, memberId, status as "active" | "removed");
    } catch (error) {
      if (!(error instanceof ServiceError)) throw error;
    }
    revalidatePath("/host/network");
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        kicker="Vendor network"
        title="The vendors you trust"
        lede="Your standing relationships, on the record. Network members see your network-visibility releases and get first call on invitations."
      />

      <Panel>
        <PanelHeader title="Invite a vendor" kicker="Cold start solved from your existing book" />
        <PanelBody>
          {candidates.length > 0 ? (
            <form action={inviteAction} className="grid gap-3 sm:grid-cols-[280px_1fr_auto]">
              <Field label="Vendor on BidSpace" htmlFor="net-vendor">
                <Select id="net-vendor" name="vendorOrganizationId" defaultValue="">
                  <option value="" disabled>
                    Choose a vendor
                  </option>
                  {candidates.map((candidate) => (
                    <option key={candidate.organization_id} value={candidate.organization_id}>
                      {candidate.display_name}
                      {candidate.category_tags.length ? ` — ${candidate.category_tags.slice(0, 3).join(", ")}` : ""}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Note" htmlFor="net-note">
                <Input id="net-note" name="note" placeholder="Great anchor vendor for our summer markets" />
              </Field>
              <Button type="submit" variant="signal" size="md" className="self-end">
                <Icon name="send" size={15} />
                Invite
              </Button>
            </form>
          ) : (
            <p className="text-sm text-ink-muted dark:text-canvas-muted">
              No new vendors to invite yet. As vendors join BidSpace they become available here —
              tell your regulars to create their business profile.
            </p>
          )}
        </PanelBody>
      </Panel>

      <section>
        <h2 className="font-display text-xl font-semibold">Network ({members.length})</h2>
        {members.length > 0 ? (
          <ul className="mt-4 grid gap-2">
            {members.map((member) => {
              const org = memberOrgs.find((o) => o.id === member.vendor_organization_id);
              return (
                <li
                  key={member.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[4px] border border-line bg-surface px-4 py-3 dark:bg-surface-dark"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-medium">
                      {org?.name ?? member.vendor_organization_id}
                      {org?.verification_status === "verified" ? (
                        <Icon name="verified" size={15} weight="fill" className="text-moss dark:text-moss-bright" />
                      ) : null}
                    </p>
                    {member.note ? (
                      <p className="text-xs text-ink-muted dark:text-canvas-muted">{member.note}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={member.status} />
                    {member.status === "invited" ? (
                      <form action={statusAction}>
                        <input type="hidden" name="memberId" value={member.id} />
                        <input type="hidden" name="status" value="active" />
                        <Button type="submit" variant="secondary" size="sm">
                          Mark active
                        </Button>
                      </form>
                    ) : null}
                    {member.status !== "removed" ? (
                      <form action={statusAction}>
                        <input type="hidden" name="memberId" value={member.id} />
                        <input type="hidden" name="status" value="removed" />
                        <Button type="submit" variant="ghost" size="sm" className="!text-alert">
                          Remove
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            className="mt-4"
            icon="network"
            title="Your network is empty"
            body="Start with the vendors you already book every season. Private network first, open marketplace when you want reach."
          />
        )}
      </section>
    </div>
  );
}
