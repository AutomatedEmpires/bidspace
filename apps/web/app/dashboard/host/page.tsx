import Link from "next/link";
import { requireHostWorkspaceContext } from "@/lib/host-access";
import { formatCents, getHostSupplySnapshot, getRelationshipLabel, pretty, shortDateTime } from "@/lib/host-supply";
import { StatusBadge } from "./_components/supply-ui";

export default async function HostOverviewPage() {
  const context = await requireHostWorkspaceContext();
  const snapshot = await getHostSupplySnapshot(context.organizationId);
  const availableUnits = snapshot.inventoryUnits.filter((unit) => ["available", "receiving_bids"].includes(unit.status)).length;
  const draftSupply = snapshot.inventoryUnits.filter((unit) => unit.status === "draft").length + snapshot.opportunities.filter((opportunity) => opportunity.status === "draft").length;

  return (
    <div className="bs-stack">
      <section className="bs-hero">
        <p className="bs-eyebrow">Host ops software</p>
        <h2>Supply control plane for {context.organizationName}</h2>
        <p>Build supply in the right order: venues anchor geography, events are optional demand windows, opportunities package commercial stories, and Inventory Units are what bidders reserve.</p>
      </section>
      <section className="bs-grid bs-grid-4">
        <Stat label="Available units" value={availableUnits} />
        <Stat label="Draft work" value={draftSupply} />
        <Stat label="Events mapped" value={snapshot.events.filter((event) => event.venue_id).length} />
        <Stat label="Opportunity packages" value={snapshot.opportunities.length} />
      </section>
      <section className="bs-grid bs-grid-2">
        <div className="bs-card bs-stack">
          <div className="bs-row"><h3>Supply model</h3><Link className="bs-button-secondary" href="/dashboard/host/inventory-units">Manage units</Link></div>
          <div className="bs-list">{snapshot.inventoryUnits.slice(0, 5).map((unit) => <div className="bs-item" key={unit.id}><div className="bs-row"><strong>{unit.name}</strong><StatusBadge status={unit.status} /></div><p className="bs-muted bs-small">{getRelationshipLabel(unit, snapshot.opportunities, snapshot.venues, snapshot.events)}</p><div className="bs-pills"><span className="bs-pill">{pretty(unit.type)}</span><span className="bs-pill">Min {formatCents(unit.minimum_bid_cents)}</span></div></div>)}</div>
        </div>
        <div className="bs-card bs-stack">
          <div className="bs-row"><h3>Lifecycle cues</h3><Link className="bs-button-secondary" href="/dashboard/host/opportunities">Manage opportunities</Link></div>
          <div className="bs-list">{snapshot.opportunities.slice(0, 5).map((opportunity) => <div className="bs-item" key={opportunity.id}><div className="bs-row"><strong>{opportunity.title}</strong><StatusBadge status={opportunity.status} /></div><p className="bs-muted bs-small">Deadline: {shortDateTime(opportunity.bid_deadline)} · Pricing: {pretty(opportunity.pricing_mode)}</p></div>)}</div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="bs-card bs-stat"><span className="bs-eyebrow">{label}</span><strong>{value}</strong></div>;
}
