import Link from "next/link";
import type { DiscoveryUnitCard } from "@/lib/discovery-data";
import {
  COMMERCE_LAYER_LABELS,
  UNIT_TYPE_LABELS,
  formatDistance,
  formatEnumLabel,
  formatMoney,
} from "@/lib/discovery-filters";

interface InventoryCardProps {
  unit: DiscoveryUnitCard;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function InventoryCard({ unit }: InventoryCardProps) {
  const place = [unit.venueCity, unit.venueState].filter(Boolean).join(", ");
  const layer = unit.commerceLayer ? COMMERCE_LAYER_LABELS[unit.commerceLayer] : "Commerce layer flexible";

  return (
    <article className="inventory-card">
      <div className="card-header">
        <div>
          <div className="pill-row card-pill-row">
            <span className="badge">{UNIT_TYPE_LABELS[unit.type]}</span>
            <span className="status-badge">{formatEnumLabel(unit.status)}</span>
          </div>
          <h3>{unit.name}</h3>
          <p className="card-subtitle">
            {[unit.opportunityTitle, unit.venueName, place].filter(Boolean).join(" · ") || "Inventory unit"}
          </p>
        </div>
        <strong>{formatMoney(unit.minimumBidCents)}</strong>
      </div>

      {unit.opportunityDescription ? <p className="card-description">{unit.opportunityDescription}</p> : null}

      <div className="card-metrics" aria-label="Unit highlights">
        <div className="metric">
          <span>Commerce layer</span>
          <strong>{layer}</strong>
        </div>
        <div className="metric">
          <span>Availability</span>
          <strong>{formatDate(unit.availabilityStart)} – {formatDate(unit.availabilityEnd)}</strong>
        </div>
        <div className="metric">
          <span>Map distance</span>
          <strong>{formatDistance(unit.distanceMeters)}</strong>
        </div>
      </div>

      <div className="pill-row">
        {unit.powerAvailable ? <span className="meta-chip">Power</span> : null}
        {unit.waterAvailable ? <span className="meta-chip">Water</span> : null}
        {unit.wifiAvailable ? <span className="meta-chip">Wi-Fi</span> : null}
        {unit.vehicleAccess ? <span className="meta-chip">Vehicle access</span> : null}
        {unit.outcomeTags.slice(0, 3).map((tag) => (
          <span className="meta-chip" key={tag}>{tag}</span>
        ))}
      </div>

      <div className="card-actions">
        <Link className="button button-primary" href={`/inventory-units/${unit.id}`}>
          View unit details
        </Link>
        <Link className="button button-ghost" href={`/sign-in?redirect_url=/inventory-units/${unit.id}`}>
          Sign in to bid
        </Link>
      </div>
    </article>
  );
}
