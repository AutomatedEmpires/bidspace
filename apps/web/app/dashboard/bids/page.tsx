import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertMessages, BidderBidCard } from "../components";
import { loadBidderWorkflow, requireActiveOrganization } from "@/lib/transaction-workflow";

export default async function BidderBidsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const authState = await auth();
  if (!authState.userId) redirect("/sign-in");

  const params = await searchParams;
  const org = await requireActiveOrganization("bidder");
  const records = await loadBidderWorkflow(org.organizationId);

  return (
    <main className="dashboard-shell stack-lg">
      <div className="page-header">
        <div className="stack">
          <p className="eyebrow">Bidder workspace</p>
          <h1>My bids</h1>
          <p className="muted">
            Manage sealed bids, counters, host decisions, and payment-before-booking prep for {org.organizationName}.
          </p>
        </div>
        <Link className="button-secondary" href="/dashboard">Dashboard</Link>
      </div>

      <AlertMessages error={params.error} success={params.success} />

      <section className="notice">
        <strong>Sealed-bid rule</strong>
        <p className="muted">
          This view only queries bids submitted by your organization. Competing bidders, bid amounts, and ranking are intentionally not shown.
        </p>
      </section>

      {records.length ? (
        <section className="grid">
          {records.map((record) => (
            <BidderBidCard
              key={record.bid.id}
              bid={record.bid}
              opportunity={record.opportunity}
              unit={record.unit}
              booking={record.booking}
              payment={record.payment}
              hostName={record.hostOrganization?.name ?? null}
            />
          ))}
        </section>
      ) : (
        <section className="card stack">
          <h2>No bids yet</h2>
          <p className="muted">Open an inventory unit detail page to submit your first sealed bid.</p>
        </section>
      )}
    </main>
  );
}
