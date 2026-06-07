import { auth } from "@clerk/nextjs/server";
import { COMMERCE_LAYER } from "@bidspace/core";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertMessages, BidderBidCard, BidStatusBadge } from "../../dashboard/components";
import { submitBidAction } from "../../dashboard/transaction-actions";
import { formatCents, humanize, loadUnitBidWorkflow, requireActiveOrganization } from "@/lib/transaction-workflow";

export default async function InventoryUnitDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ unitId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const authState = await auth();
  if (!authState.userId) redirect("/sign-in");

  const [{ unitId }, query] = await Promise.all([params, searchParams]);
  const org = await requireActiveOrganization("bidder");
  const { unit, opportunity, ownBids } = await loadUnitBidWorkflow(unitId, org.organizationId);
  const canBid = opportunity?.status === "receiving_bids";

  return (
    <main className="dashboard-shell stack-lg">
      <div className="page-header">
        <div className="stack">
          <p className="eyebrow">Inventory unit</p>
          <h1>{unit.name}</h1>
          <p className="muted">Submit and track sealed bids for this unit. Your organization only sees its own bid history here.</p>
        </div>
        <Link className="button-secondary" href="/dashboard/bids">My bids</Link>
      </div>

      <AlertMessages error={query.error} success={query.success} />

      <section className="two-column">
        <div className="card stack">
          <div className="card-header">
            <div>
              <p className="eyebrow">{opportunity?.title ?? "Opportunity"}</p>
              <h2>{unit.name}</h2>
            </div>
            <span className="badge">{humanize(unit.status)}</span>
          </div>
          <div className="stat-row">
            <div className="stat">
              <span className="muted">Minimum bid</span>
              <strong>{formatCents(unit.minimum_bid_cents ?? opportunity?.minimum_bid_cents)}</strong>
            </div>
            <div className="stat">
              <span className="muted">Pricing mode</span>
              <strong>{humanize(unit.pricing_mode)}</strong>
            </div>
            <div className="stat">
              <span className="muted">Opportunity status</span>
              <strong>{opportunity ? humanize(opportunity.status) : "Unknown"}</strong>
            </div>
          </div>
          <p className="muted">
            BidSpace uses sealed bids by default. Your amount is visible to the host, never to competing bidders, and the highest bid is not auto-selected.
          </p>
        </div>

        <aside className="card card-soft stack">
          <h2>Submit sealed bid</h2>
          {canBid && opportunity ? (
            <form action={submitBidAction} className="form-grid">
              <input type="hidden" name="opportunityId" value={opportunity.id} />
              <input type="hidden" name="inventoryUnitId" value={unit.id} />
              <input type="hidden" name="returnTo" value={`/inventory-units/${unit.id}`} />
              <label>
                Bid amount (USD)
                <input name="amountDollars" inputMode="decimal" placeholder="2500" required />
              </label>
              <label>
                Commerce layer
                <select name="commerceLayer" defaultValue={opportunity.commerce_layer ?? ""}>
                  <option value="">Choose fit signal</option>
                  {COMMERCE_LAYER.map((layer) => (
                    <option value={layer} key={layer}>{humanize(layer)}</option>
                  ))}
                </select>
              </label>
              <label>
                Intended use
                <textarea name="intendedUse" rows={4} placeholder="Describe your activation, setup, power/water needs, staffing, and why this unit is a good fit." />
              </label>
              <button className="button" type="submit">Submit sealed bid</button>
            </form>
          ) : (
            <div className="notice">
              <strong>Bidding unavailable</strong>
              <p className="muted">This opportunity is not currently receiving bids.</p>
            </div>
          )}
        </aside>
      </section>

      <section className="stack">
        <div className="split-header">
          <div>
            <h2>Your bid history for this unit</h2>
            <p className="muted">Only bids from {org.organizationName} are queried on this page.</p>
          </div>
          {ownBids[0] ? <BidStatusBadge status={ownBids[0].bid.status} /> : null}
        </div>
        {ownBids.length ? (
          <div className="grid">
            {ownBids.map((record) => (
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
          </div>
        ) : (
          <div className="card">
            <p className="muted">No sealed bid from your organization has been submitted for this unit yet.</p>
          </div>
        )}
      </section>
    </main>
  );
}
