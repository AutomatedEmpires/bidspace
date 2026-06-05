import type { DiscoveredUnit } from "@bidspace/services";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";
import {
  formatCommerceLayerLabel,
  formatCurrencyCents,
  formatDistanceMiles,
  formatInventoryUnitTypeLabel,
  getDiscoveryHref,
} from "@/lib/discovery";

const metaLabelStyle = { fontSize: 12, opacity: 0.65, textTransform: "uppercase" as const, letterSpacing: "0.08em" };
const metaValueStyle = { fontSize: 15, fontWeight: 700 as const, marginTop: 4 };

export function ListingCard({ unit }: { unit: DiscoveredUnit }) {
  return (
    <Card style={{ display: "grid", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <Badge>{formatInventoryUnitTypeLabel(unit.type)}</Badge>
            {unit.commerceLayer ? <Badge>{formatCommerceLayerLabel(unit.commerceLayer)}</Badge> : null}
          </div>
          <h2 style={{ fontSize: 24, marginBottom: 8 }}>{unit.name}</h2>
          <p style={{ lineHeight: 1.6, opacity: 0.82 }}>
            Opportunity {unit.opportunityId.slice(0, 8)} · Organization {unit.organizationId.slice(0, 8)}
          </p>
        </div>
        <StatusChip status={unit.status} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        <div>
          <p style={metaLabelStyle}>Minimum bid</p>
          <p style={metaValueStyle}>{formatCurrencyCents(unit.minimumBidCents)}</p>
        </div>
        <div>
          <p style={metaLabelStyle}>Distance</p>
          <p style={metaValueStyle}>{formatDistanceMiles(unit.distanceMeters)}</p>
        </div>
        <div>
          <p style={metaLabelStyle}>Coordinates</p>
          <p style={metaValueStyle}>
            {unit.latitude.toFixed(4)}, {unit.longitude.toFixed(4)}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <p style={{ fontSize: 14, opacity: 0.72 }}>Backed by the canonical `DiscoveredUnit` service contract.</p>
        <ButtonLink href={getDiscoveryHref(unit)}>View listing</ButtonLink>
      </div>
    </Card>
  );
}