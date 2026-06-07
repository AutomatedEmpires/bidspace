import Link from "next/link";
import { notFound } from "next/navigation";
import { getInventoryUnitDetail } from "@/lib/discovery-data";
import {
  COMMERCE_LAYER_LABELS,
  UNIT_TYPE_LABELS,
  formatEnumLabel,
  formatMoney,
} from "@/lib/discovery-filters";

type InventoryUnitPageProps = {
  params: Promise<{ id: string }>;
};

function formatDateTime(value: string | null): string {
  if (!value) return "Not specified";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function yesNo(value: boolean | null): string {
  if (value == null) return "Ask host";
  return value ? "Yes" : "No";
}

export async function generateMetadata({ params }: InventoryUnitPageProps) {
  const { id } = await params;
  const unit = await getInventoryUnitDetail(id);
  return {
    title: unit ? `${unit.name} · BidSpace` : "Inventory unit · BidSpace",
    description: unit?.opportunityDescription ?? "BidSpace inventory unit detail",
  };
}

export default async function InventoryUnitPage({ params }: InventoryUnitPageProps) {
  const { id } = await params;
  const unit = await getInventoryUnitDetail(id);
  if (!unit) notFound();

  const place = [unit.venueName, unit.venueCity, unit.venueState].filter(Boolean).join(" · ");
  const layer = unit.commerceLayer ? COMMERCE_LAYER_LABELS[unit.commerceLayer] : "Flexible commerce layer";

  return (
    <main className="detail-shell">
      <nav className="top-nav" aria-label="Primary navigation">
        <Link href="/" className="brand-mark">BidSpace</Link>
        <div className="nav-actions">
          <Link href="/discover">Back to discovery</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/sign-up" className="button button-dark">Create bidder profile</Link>
        </div>
      </nav>

      <section className="detail-hero">
        <div className="detail-title">
          <p className="eyebrow">Inventory unit detail</p>
          <h1>{unit.name}</h1>
          <p className="detail-lede">
            {[unit.opportunityTitle, place, unit.hostName].filter(Boolean).join(" · ")}
          </p>
          <div className="pill-row">
            <span className="badge">{UNIT_TYPE_LABELS[unit.type]}</span>
            <span className="badge">{layer}</span>
            <span className="status-badge">{formatEnumLabel(unit.status)}</span>
          </div>
        </div>

        <aside className="detail-panel">
          <p className="eyebrow">Sealed bidding</p>
          <h2>{formatMoney(unit.minimumBidCents)}</h2>
          <p className="detail-muted">
            Bid amounts stay private to bidders. Hosts can review all bids and select the best fit; highest bid does not auto-win.
          </p>
          <div className="detail-actions">
            <Link href={`/sign-in?redirect_url=/inventory-units/${unit.id}`} className="button button-primary">
              Sign in to bid
            </Link>
            <Link href="/sign-up" className="button button-ghost">
              Create bidder profile
            </Link>
          </div>
        </aside>
      </section>

      <section className="detail-stats" aria-label="Inventory unit facts">
        <div className="stat-card">
          <span>Available from</span>
          <strong>{formatDateTime(unit.availabilityStart)}</strong>
        </div>
        <div className="stat-card">
          <span>Available until</span>
          <strong>{formatDateTime(unit.availabilityEnd)}</strong>
        </div>
        <div className="stat-card">
          <span>Location precision</span>
          <strong>{unit.latitude != null && unit.longitude != null ? "Unit pin" : "Host-provided"}</strong>
        </div>
      </section>

      <section className="detail-panels">
        <article className="detail-panel">
          <h2>Opportunity context</h2>
          <p className="detail-muted">{unit.opportunityDescription ?? unit.audienceProfile ?? "Host details will appear here as this inventory unit is enriched."}</p>
          <div className="pill-row">
            {unit.estimatedAttendance ? <span className="meta-chip">Estimated attendance {unit.estimatedAttendance.toLocaleString("en-US")}</span> : null}
            {unit.eventName ? <span className="meta-chip">{unit.eventName}</span> : null}
            {unit.eventStartsAt ? <span className="meta-chip">Event starts {formatDateTime(unit.eventStartsAt)}</span> : null}
          </div>
        </article>

        <article className="detail-panel">
          <h2>Unit logistics</h2>
          <div className="card-metrics">
            <div className="metric"><span>Dimensions</span><strong>{unit.dimensions ?? "Ask host"}</strong></div>
            <div className="metric"><span>Indoor</span><strong>{yesNo(unit.indoor)}</strong></div>
            <div className="metric"><span>Vehicle access</span><strong>{yesNo(unit.vehicleAccess)}</strong></div>
            <div className="metric"><span>Power</span><strong>{yesNo(unit.powerAvailable)}</strong></div>
            <div className="metric"><span>Water</span><strong>{yesNo(unit.waterAvailable)}</strong></div>
            <div className="metric"><span>Wi-Fi</span><strong>{yesNo(unit.wifiAvailable)}</strong></div>
          </div>
          <p className="detail-muted">
            Setup: {unit.setupWindow ?? "Ask host"}. Teardown: {unit.teardownWindow ?? "Ask host"}.
          </p>
        </article>

        <article className="detail-panel">
          <h2>Bidder fit and host review</h2>
          <ul className="assurance-list">
            <li>Submit a sealed bid for this unit; other bidders do not see your amount or identity.</li>
            <li>The host reviews bid fit, intended use, requirements, and price before selection.</li>
            <li>Required documents: {unit.requiredDocuments.length ? unit.requiredDocuments.join(", ") : "none listed yet"}.</li>
            <li>Category restrictions: {unit.categoryRestrictions.length ? unit.categoryRestrictions.join(", ") : "none listed yet"}.</li>
          </ul>
        </article>

        <article className="map-panel">
          <div>
            <p className="eyebrow">Map-ready location</p>
            <h2>{unit.latitude != null && unit.longitude != null ? `${unit.latitude.toFixed(4)}, ${unit.longitude.toFixed(4)}` : "Coordinates pending"}</h2>
            <p className="detail-muted">A rich Mapbox view can render this same unit pin from the detail API response.</p>
          </div>
          <div className="map-panel-visual">
            <span className="map-pin pin-b" />
          </div>
        </article>
      </section>
    </main>
  );
}
