import type { Metadata } from "next";
import { buildTrustSignals, listDocumentsForOrganization, listReviewsForOrganization } from "@bidspace/services";
import type { OrganizationRow } from "@bidspace/db";
import {
  DescriptionList,
  EmptyState,
  Icon,
  PageHeader,
  Panel,
  PanelBody,
  PanelHeader,
  StatusBadge,
} from "@bidspace/ui";
import { requireHostContext } from "@/lib/org-context";
import { tryGetDb } from "@/lib/safe-db";

export const metadata: Metadata = { title: "Settings & future fees" };
export const dynamic = "force-dynamic";

export default async function HostSettingsPage() {
  const context = await requireHostContext();
  const db = tryGetDb();
  if (!db) return <EmptyState icon="warning" title="Marketplace data is not connected" />;

  const orgId = context.activeDbOrganizationId;
  const organization = (
    await db.from("organizations").select("*").eq("id", orgId).maybeSingle()
  ).data as OrganizationRow | null;
  if (!organization) {
    return <EmptyState icon="warning" title="Organization record not found" />;
  }

  const [documents, reviews] = await Promise.all([
    listDocumentsForOrganization(db, orgId),
    listReviewsForOrganization(db, orgId),
  ]);
  const completedBookings = (
    await db
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("host_organization_id", orgId)
      .in("status", ["completed", "reviewed"])
  ).count ?? 0;
  const trust = buildTrustSignals({
    organization,
    completedBookings,
    reviewCount: reviews.length,
    currentDocuments: documents,
  });

  return (
    <div className="grid gap-8">
      <PageHeader
        kicker="Settings"
        title={organization.name}
        lede="Organization trust and the dormant commercial model for this founder preview."
        actions={<StatusBadge status={organization.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Future host fees" kicker="Dormant — founder approval required" />
          <PanelBody className="grid gap-4">
            <p className="rounded-[3px] border border-plan/30 bg-plan/[0.06] p-3 text-sm text-plan-deep dark:text-plan-bright">
              BidSpace cannot collect money, onboard a payout account, or create a paid booking in
              this phase. Adding provider secrets does not change this gate.
            </p>
            <DescriptionList
              columns={1}
              items={[
                { term: "Current fee plan", detail: "Dormant / founder review" },
                { term: "Expected payer", detail: "Host side" },
                { term: "Possible models", detail: "Listing, placement, promotion, or subscription fees" },
                { term: "Vendor checkout", detail: "Disabled" },
                { term: "Payout onboarding", detail: "Disabled" },
              ]}
            />
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title="Trust provenance" kicker="What vendors see about you" />
          <PanelBody>
            <ul className="grid gap-3">
              {trust.map((signal) => (
                <li key={signal.key} className="flex items-start gap-2.5">
                  <Icon
                    name={signal.earned ? "verified" : "pending"}
                    size={17}
                    weight={signal.earned ? "fill" : "regular"}
                    className={
                      signal.earned
                        ? "mt-0.5 shrink-0 text-moss dark:text-moss-bright"
                        : "mt-0.5 shrink-0 text-ink-faint dark:text-canvas-faint"
                    }
                  />
                  <span>
                    <span className="block text-sm font-semibold">{signal.label}</span>
                    <span className="block text-xs text-ink-muted dark:text-canvas-muted">{signal.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </PanelBody>
        </Panel>
      </div>

      <Panel>
        <PanelHeader title="Organization" kicker="Managed in Clerk" />
        <PanelBody>
          <DescriptionList
            items={[
              { term: "Name", detail: organization.name },
              { term: "Type", detail: organization.organization_type.replace(/_/g, " ") },
              { term: "Verification", detail: organization.verification_status.replace(/_/g, " ") },
              { term: "Members & invites", detail: "Use the organization switcher menu to manage your team." },
            ]}
          />
        </PanelBody>
      </Panel>
    </div>
  );
}
