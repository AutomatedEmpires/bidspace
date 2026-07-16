import Link from "next/link";
import type { Metadata } from "next";
import { formatMoney } from "@bidspace/core";
import { listOpportunitiesForOrg } from "@bidspace/services";
import { EmptyState, Icon, PageHeader, StatusBadge, Table, TBody, TD, TH, THead, buttonClasses } from "@bidspace/ui";
import { requireHostContext } from "@/lib/org-context";
import { tryGetDb } from "@/lib/safe-db";
import { describeDeadline } from "@/lib/format";

export const metadata: Metadata = { title: "Opportunities" };
export const dynamic = "force-dynamic";

export default async function HostOpportunitiesPage() {
  const context = await requireHostContext();
  const db = tryGetDb();
  if (!db) return <EmptyState icon="warning" title="Marketplace data is not connected" />;

  const opportunities = await listOpportunitiesForOrg(db, context.activeDbOrganizationId);

  const VISIBILITY_LABEL: Record<string, string> = {
    public: "Public",
    network: "Network",
    invite_only: "Invite only",
  };

  return (
    <div className="grid gap-8">
      <PageHeader
        kicker="Spaces"
        title="Your temporary vendor-space releases"
        lede="Reuse a venue, booth, pad, stall, kiosk, or placement across dates. Draft the release, add spaces, set requirements, invite vendors, and review bids or applications."
        actions={
          <Link href="/host/opportunities/new" className={buttonClasses("signal", "md")}>
            <Icon name="add" size={17} />
            New space listing
          </Link>
        }
      />

      {opportunities.length > 0 ? (
        <Table>
          <THead>
            <tr>
              <TH>Space listing</TH>
              <TH>Visibility</TH>
              <TH>Placement method</TH>
              <TH className="text-right">Floor</TH>
              <TH>Deadline</TH>
              <TH>Status</TH>
              <TH />
            </tr>
          </THead>
          <TBody>
            {opportunities.map((o) => (
              <tr key={o.id}>
                <TD className="font-medium">{o.title}</TD>
                <TD className="text-ink-muted dark:text-canvas-muted">
                  {VISIBILITY_LABEL[o.visibility] ?? o.visibility}
                </TD>
                <TD className="capitalize text-ink-muted dark:text-canvas-muted">
                  {o.allocation_mode.replace(/_/g, " ")}
                </TD>
                <TD className="text-right tabular-nums">
                  {o.allocation_mode === "bid" && o.minimum_bid_cents != null
                    ? formatMoney(o.minimum_bid_cents)
                    : "—"}
                </TD>
                <TD className="text-sm">{describeDeadline(o.bid_deadline) ?? "—"}</TD>
                <TD>
                  <StatusBadge status={o.status} />
                </TD>
                <TD className="text-right">
                  <Link href={`/host/opportunities/${o.id}`} className={buttonClasses("secondary", "sm")}>
                    Manage
                  </Link>
                </TD>
              </tr>
            ))}
          </TBody>
        </Table>
      ) : (
        <EmptyState
          icon="opportunity"
          title="No space listings yet"
          body="Start with the venue or event you control, then define the booth, pad, stall, kiosk, or placement vendors can pursue."
          actions={
            <Link href="/host/opportunities/new" className={buttonClasses("signal", "sm")}>
              Create your first space listing
            </Link>
          }
        />
      )}
    </div>
  );
}
