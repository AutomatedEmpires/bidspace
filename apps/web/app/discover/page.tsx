import Link from "next/link";
import { DiscoveryFilters } from "./_components/discovery-filters";
import { InventoryCard } from "./_components/inventory-card";
import { getDiscoveryResult } from "@/lib/discovery-data";
import { formatMoney } from "@/lib/discovery-filters";

type DiscoverPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = {
  title: "Discover inventory · BidSpace",
  description: "Browse map-ready temporary commercial inventory units on BidSpace.",
};

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const result = await getDiscoveryResult(await searchParams);

  return (
    <main className="discovery-shell">
      <nav className="top-nav" aria-label="Primary navigation">
        <Link href="/" className="brand-mark">BidSpace</Link>
        <div className="nav-actions">
          <Link href="/discover">Discover</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/sign-up" className="button button-dark">Create bidder profile</Link>
        </div>
      </nav>

      <section className="discovery-hero">
        <p className="eyebrow">Public discovery</p>
        <h1>Browse biddable inventory units.</h1>
        <p>
          List-first discovery backed by spatial query params. Results stay faithful to BidSpace’s locked model:
          inventory-unit-first, sealed bids, and curated host selection.
        </p>
      </section>

      <section className="discovery-layout">
        <DiscoveryFilters filters={result.filters} />

        <div>
          <div className="results-header">
            <div>
              <p className="eyebrow">{result.mode === "radius" ? "Radius search" : "Viewport search"}</p>
              <h2>Available units</h2>
            </div>
            <span className="results-count">{result.units.length} found</span>
          </div>

          {result.units.length ? (
            <div className="results-stack">
              {result.units.map((unit) => <InventoryCard key={unit.id} unit={unit} />)}
            </div>
          ) : (
            <div className="empty-state">
              <p className="eyebrow">No inventory found</p>
              <h2>Try widening the map, clearing filters, or increasing the radius.</h2>
              <p>
                BidSpace only surfaces available inventory units. Draft, archived, booked, and private host inventory
                stays out of public discovery.
              </p>
              <div className="filter-actions">
                <Link href="/discover" className="button button-primary">Clear filters</Link>
                <Link href="/sign-up" className="button button-ghost">Create bidder profile</Link>
              </div>
            </div>
          )}

          <aside className="map-panel" aria-label="Map-ready data preview">
            <div>
              <p className="eyebrow">Map-ready plumbing</p>
              <h2>Markers from the same search result</h2>
              <p className="detail-muted">
                A full Mapbox client can consume these same filters through /api/v1/inventory-units/search.
              </p>
            </div>
            <div className="map-panel-visual">
              {result.markers.slice(0, 6).map((marker, index) => (
                <span
                  key={marker.id}
                  className="map-pin"
                  title={marker.name}
                  style={{
                    left: `${18 + ((index * 17) % 68)}%`,
                    top: `${20 + ((index * 23) % 58)}%`,
                  }}
                />
              ))}
            </div>
            <div className="map-marker-list">
              {result.markers.slice(0, 5).map((marker) => (
                <p key={marker.id}>
                  <strong>{marker.name}</strong> · {marker.latitude.toFixed(4)}, {marker.longitude.toFixed(4)} · {formatMoney(marker.minimumBidCents)}
                </p>
              ))}
              {!result.markers.length ? <p>No marker coordinates are available for this result set.</p> : null}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
