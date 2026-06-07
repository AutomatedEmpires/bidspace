import { auth } from "@clerk/nextjs/server";
import type { BidStatus } from "@bidspace/core";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertMessages, HostBidCard } from "../../components";
import { loadHostWorkflow, requireActiveOrganization } from "@/lib/transaction-workflow";

const PIPELINE_GROUPS: Array<{ title: string; statuses: BidStatus[]; description: string }> = [
  {
    title: "Inbox",
    statuses: ["submitted", "viewed"],
    description: "New and reviewed bids awaiting host curation.",
  },
  {
    title: "Curating",
    statuses: ["shortlisted", "countered", "waitlisted"],
    description: "Fit checks, counters, and backup candidates.",
  },
  {
    title: "Booking prep",
    statuses: ["accepted", "payment_pending", "paid", "booked"],
    description: "Accepted bids moving toward payment-before-booking.",
  },
  {
    title: "Closed",
    statuses: ["rejected", "withdrawn", "expired", "completed", "reviewed"],
    description: "No longer active in the current selection cycle.",
  },
];

export default async function HostBidsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const authState = await auth();
  if (!authState.userId) redirect("/sign-in");

  const params = await searchParams;
  const org = await requireActiveOrganization("host");
  const records = await loadHostWorkflow(org.organizationId);

  return (
    <main className="dashboard-shell stack-lg">
      <div className="page-header">
        <div className="stack">
          <p className="eyebrow">Host bid pipeline</p>
          <h1>Incoming bids</h1>
          <p className="muted">
            View every bid for {org.organizationName}, curate finalists, send counters, and open booking prep without running live payments.
          </p>
        </div>
        <Link className="button-secondary" href="/dashboard">Dashboard</Link>
      </div>

      <AlertMessages error={params.error} success={params.success} />

      <section className="notice">
        <strong>Curated host selection</strong>
        <p className="muted">
          Hosts can see full bid details, but the UI does not rank by highest price or expose a public leaderboard. Selection remains host-curated.
        </p>
      </section>

      <section className="stat-row">
        <div className="card stat">
          <span className="muted">Total bids</span>
          <strong>{records.length}</strong>
        </div>
        <div className="card stat">
          <span className="muted">Payment pending</span>
          <strong>{records.filter((record) => record.bid.status === "payment_pending").length}</strong>
        </div>
        <div className="card stat">
          <span className="muted">Booking prep records</span>
          <strong>{records.filter((record) => record.booking).length}</strong>
        </div>
      </section>

      {records.length ? (
        <section className="pipeline-columns">
          {PIPELINE_GROUPS.map((group) => {
            const groupedRecords = records.filter((record) => group.statuses.includes(record.bid.status));
            return (
              <div className="pipeline-column" key={group.title}>
                <div className="split-header">
                  <div>
                    <h2>{group.title}</h2>
                    <p className="muted">{group.description}</p>
                  </div>
                  <span className="badge">{groupedRecords.length}</span>
                </div>
                {groupedRecords.map((record) => (
                  <HostBidCard
                    key={record.bid.id}
                    bid={record.bid}
                    opportunity={record.opportunity}
                    unit={record.unit}
                    booking={record.booking}
                    payment={record.payment}
                    bidderName={record.bidderOrganization?.name ?? null}
                  />
                ))}
              </div>
            );
          })}
        </section>
      ) : (
        <section className="card stack">
          <h2>No incoming bids yet</h2>
          <p className="muted">When bidders submit sealed bids against your opportunities or units, they will appear here.</p>
        </section>
      )}
    </main>
  );
}
