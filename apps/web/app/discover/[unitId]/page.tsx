import { getInventoryUnit, getOpportunity, NotFoundError } from "@bidspace/services";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page-shell";
import { StatusChip } from "@/components/ui/status-chip";
import { createServerBidspaceClient } from "@/lib/bidspace-server";
import {
  formatCurrencyCents,
  formatInventoryUnitTypeLabel,
  getInventoryUnitCoordinates,
} from "@/lib/discovery";

export const dynamic = "force-dynamic";

async function loadDiscoveryDetail(unitId: string) {
  const db = createServerBidspaceClient();

  try {
    const unit = await getInventoryUnit(db, unitId);
    const coordinates = getInventoryUnitCoordinates(unit);

    let opportunityTitle: string | null = null;
    try {
      const opportunity = await getOpportunity(db, unit.opportunity_id);
      opportunityTitle = opportunity.title;
    } catch {
      opportunityTitle = null;
    }

    return { unit, coordinates, opportunityTitle };
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }

    throw error;
  }
}

export default async function DiscoveryDetailPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;
  const { unit, coordinates, opportunityTitle } = await loadDiscoveryDetail(unitId);

  return (
    <PageShell
      eyebrow="Listing detail"
      title={unit.name}
      description={opportunityTitle ?? "A thin detail shell backed by the canonical inventory-unit service contract."}
      actions={<ButtonLink href="/discover">Back to discovery</ButtonLink>}
    >
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        <Card style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <Badge>{formatInventoryUnitTypeLabel(unit.type)}</Badge>
            <StatusChip status={unit.status} />
          </div>
          <div>
            <p style={{ fontSize: 12, opacity: 0.65, textTransform: "uppercase", letterSpacing: "0.08em" }}>Minimum bid</p>
            <p style={{ fontSize: 24, marginTop: 6 }}>{formatCurrencyCents(unit.minimum_bid_cents)}</p>
          </div>
          <div>
            <p style={{ fontSize: 12, opacity: 0.65, textTransform: "uppercase", letterSpacing: "0.08em" }}>Opportunity</p>
            <p style={{ fontSize: 18, marginTop: 6 }}>{unit.opportunity_id}</p>
          </div>
        </Card>

        <Card style={{ display: "grid", gap: 16 }}>
          <div>
            <p style={{ fontSize: 12, opacity: 0.65, textTransform: "uppercase", letterSpacing: "0.08em" }}>Availability start</p>
            <p style={{ fontSize: 18, marginTop: 6 }}>{new Date(unit.availability_start).toLocaleString()}</p>
          </div>
          <div>
            <p style={{ fontSize: 12, opacity: 0.65, textTransform: "uppercase", letterSpacing: "0.08em" }}>Availability end</p>
            <p style={{ fontSize: 18, marginTop: 6 }}>{new Date(unit.availability_end).toLocaleString()}</p>
          </div>
          <div>
            <p style={{ fontSize: 12, opacity: 0.65, textTransform: "uppercase", letterSpacing: "0.08em" }}>Coordinates</p>
            <p style={{ fontSize: 18, marginTop: 6 }}>
              {coordinates ? `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}` : "Not geocoded yet"}
            </p>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}