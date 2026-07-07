import Link from "next/link";
import type { Metadata } from "next";
import { listPublicOpportunities, listSavedOpportunityIds } from "@bidspace/services";
import { EmptyState, PageHeader, buttonClasses } from "@bidspace/ui";
import { OpportunityCard } from "@/components/opportunity-card";
import { requireVendorContext } from "@/lib/org-context";
import { tryGetDb } from "@/lib/safe-db";

export const metadata: Metadata = { title: "Saved" };
export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const context = await requireVendorContext();
  const db = tryGetDb();
  if (!db) {
    return <EmptyState icon="warning" title="Marketplace data is not connected" />;
  }

  const savedIds = await listSavedOpportunityIds(db, context.activeDbOrganizationId);
  // Saved items may include network/invite listings the org can see; the
  // public list covers the common case and detail pages re-enforce visibility.
  const all = savedIds.length ? await listPublicOpportunities(db, { limit: 200 }) : [];
  const saved = all.filter((o) => savedIds.includes(o.id));

  return (
    <div className="grid gap-8">
      <PageHeader
        kicker="Saved"
        title="Your shortlist"
        lede="Opportunities you flagged as worth pursuing. Deadlines keep moving — bid before the window closes."
      />
      {saved.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {saved.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="save"
          title="Nothing saved yet"
          body="When an opportunity looks right but you are not ready to bid, save it here so it does not slip."
          actions={
            <Link href="/discover" className={buttonClasses("signal", "sm")}>
              Browse opportunities
            </Link>
          }
        />
      )}
    </div>
  );
}
