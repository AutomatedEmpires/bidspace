import Link from "next/link";
import type { Metadata } from "next";
import { getAdminQueueCounts } from "@bidspace/services";
import { EmptyState, PageHeader, StatTile } from "@bidspace/ui";
import { requireAdminUser } from "@/lib/admin-gate";
import { tryGetDb } from "@/lib/safe-db";

export const metadata: Metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  await requireAdminUser();
  const db = tryGetDb();
  if (!db) return <EmptyState icon="warning" title="Marketplace data is not connected" />;

  const counts = await getAdminQueueCounts(db);
  const total =
    counts.pendingVerifications +
    counts.pendingOrganizations +
    counts.flaggedReviews +
    counts.disputedBookings +
    counts.failedPayments;

  return (
    <div className="grid gap-8">
      <PageHeader
        kicker="Admin"
        title={total > 0 ? `${total} item${total === 1 ? "" : "s"} need intervention` : "All queues clear"}
        lede="Marketplace quality is an operating job: verification, disputes, and money exceptions come before anything decorative."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/verification">
          <StatTile
            label="Verifications pending"
            value={counts.pendingVerifications + counts.pendingOrganizations}
            icon="verified"
            tone={counts.pendingVerifications + counts.pendingOrganizations > 0 ? "attention" : "default"}
            hint="Organizations and documents waiting for review"
          />
        </Link>
        <Link href="/admin/reports">
          <StatTile
            label="Flagged reviews"
            value={counts.flaggedReviews}
            icon="review"
            tone={counts.flaggedReviews > 0 ? "attention" : "default"}
          />
        </Link>
        <Link href="/admin/reports">
          <StatTile
            label="Disputed bookings"
            value={counts.disputedBookings}
            icon="alert"
            tone={counts.disputedBookings > 0 ? "attention" : "default"}
          />
        </Link>
        <Link href="/admin/payments">
          <StatTile
            label="Payment exceptions"
            value={counts.failedPayments}
            icon="money"
            tone={counts.failedPayments > 0 ? "attention" : "default"}
            hint="Failed or disputed movements"
          />
        </Link>
        <Link href="/admin/organizations">
          <StatTile label="Organizations" value="Browse" icon="venue" hint="Suspend, restore, inspect" />
        </Link>
      </div>
    </div>
  );
}
