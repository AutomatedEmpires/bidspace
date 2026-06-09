import { COMMERCE_LAYER, INVENTORY_UNIT_TYPE } from "@bidspace/core";
import { searchNearbyUnits, type DiscoveredUnit } from "@bidspace/services";
import { DiscoveryEmptyState } from "@/components/discovery/discovery-empty-state";
import { DiscoveryErrorState } from "@/components/discovery/discovery-error-state";
import { ListingCard } from "@/components/discovery/listing-card";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page-shell";
import { createServerBidspaceClient } from "@/lib/bidspace-server";
import { resolveDiscoverySearchState } from "@/lib/discovery";

export const dynamic = "force-dynamic";

const formLabelStyle = { display: "grid", gap: 8, fontSize: 14, fontWeight: 700 as const };
const inputStyle = {
  borderRadius: 14,
  border: "1px solid color-mix(in srgb, var(--foreground) 16%, transparent)",
  padding: "12px 14px",
  background: "transparent",
  color: "inherit",
};

const starterMarkets = [
  { label: "Los Angeles", href: "/discover?lat=34.0522&lng=-118.2437&radius=7500" },
  { label: "Dallas", href: "/discover?lat=32.7767&lng=-96.7970&radius=7500" },
  { label: "Atlanta", href: "/discover?lat=33.7490&lng=-84.3880&radius=7500" },
];

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const search = resolveDiscoverySearchState(await searchParams);

  let units: DiscoveredUnit[] = [];
  let loadError = search.error;

  if (search.params) {
    try {
      units = await searchNearbyUnits(createServerBidspaceClient(), search.params);
    } catch (error) {
      loadError = error instanceof Error ? error.message : "Discovery search failed.";
    }
  }

  return (
    <PageShell
      eyebrow="Market discovery"
      title="Find active inventory units"
      description="This first discovery slice is card-first and contract-first: it maps URL search input into the canonical `NearbyUnitsParams` contract and renders the real `DiscoveredUnit` service response."
      actions={<ButtonLink href="/">Back home</ButtonLink>}
    >
      <Card style={{ marginBottom: 24 }}>
        <form action="/discover" method="get" style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
            <label style={formLabelStyle}>
              Latitude
              <input name="lat" defaultValue={search.values.lat} placeholder="34.0522" style={inputStyle} />
            </label>
            <label style={formLabelStyle}>
              Longitude
              <input name="lng" defaultValue={search.values.lng} placeholder="-118.2437" style={inputStyle} />
            </label>
            <label style={formLabelStyle}>
              Radius (meters)
              <input name="radius" defaultValue={search.values.radius} placeholder="7500" style={inputStyle} />
            </label>
            <label style={formLabelStyle}>
              Result limit
              <input name="limit" defaultValue={search.values.limit} placeholder="24" style={inputStyle} />
            </label>
            <label style={formLabelStyle}>
              Inventory type
              <select name="type" defaultValue={search.values.type} style={inputStyle}>
                <option value="">All types</option>
                {INVENTORY_UNIT_TYPE.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label style={formLabelStyle}>
              Commerce layer
              <select name="commerceLayer" defaultValue={search.values.commerceLayer} style={inputStyle}>
                <option value="">All layers</option>
                {COMMERCE_LAYER.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <p style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.72 }}>
              Starter markets:
              {starterMarkets.map((market) => (
                <span key={market.label} style={{ marginLeft: 12 }}>
                  <a href={market.href} style={{ textDecoration: "underline" }}>
                    {market.label}
                  </a>
                </span>
              ))}
            </p>
            <button
              type="submit"
              style={{
                borderRadius: 999,
                border: "1px solid var(--foreground)",
                background: "var(--foreground)",
                color: "var(--background)",
                padding: "12px 18px",
                fontWeight: 700,
              }}
            >
              Run discovery
            </button>
          </div>
        </form>
      </Card>

      {loadError ? (
        <DiscoveryErrorState message={loadError} />
      ) : search.params ? (
        units.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {units.map((unit) => (
              <ListingCard key={unit.id} unit={unit} />
            ))}
          </div>
        ) : (
          <DiscoveryEmptyState hasActiveSearch />
        )
      ) : (
        <DiscoveryEmptyState hasActiveSearch={false} />
      )}
    </PageShell>
  );
}