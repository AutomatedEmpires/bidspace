import Link from "next/link";

import { DiscoveryCard } from "../../components/discovery/discovery-card";
import { FilterPanel } from "../../components/discovery/filter-panel";
import { MapPreview } from "../../components/discovery/map-preview";
import {
  loadDiscoveryResults,
  parseDiscoverySearchParams,
  type DiscoveryQuery,
  type DiscoveryResults,
} from "../../lib/discovery";

export const metadata = {
  title: "Discover inventory units | BidSpace",
  description:
    "Browse vendor spaces, sponsor assets, service slots, and advertising placements from curated hosts. Bids are sealed.",
};

type SearchParams = Record<string, string | string[] | undefined>;

function describeQuery(query: DiscoveryQuery): string {
  if (query.locationMode === "near") {
    if (query.latitude != null && query.longitude != null) {
      return `Within ${Math.round(query.radiusMeters / 1000)} km of your point`;
    }
    return "Add a point to search nearby \u2014 showing everything for now";
  }
  if (query.locationMode === "viewport") {
    if (query.viewport) return "Within your map viewport";
    return "Set a viewport to search \u2014 showing everything for now";
  }
  return "Browsing every region";
}

function RouteSafeNotice({ title, message }: { title: string; message: string }) {
  return (
    <div className="notice" role="status">
      <p className="notice__title">{title}</p>
      <p className="notice__body">{message}</p>
    </div>
  );
}

function EmptyDiscoveryState() {
  return (
    <div className="empty-state">
      <p className="empty-state__title">No inventory units match these filters yet</p>
      <p className="empty-state__body">
        Try widening your search radius, switching the commerce layer, or browsing every
        region.
      </p>
      <Link href="/discover" className="button button--ghost">
        Reset filters
      </Link>
    </div>
  );
}

function ResultsBody({ results }: { results: DiscoveryResults }) {
  if (results.status === "configuration_error") {
    return (
      <RouteSafeNotice
        title="Inventory data source not connected"
        message={
          results.message ??
          "Discovery will list live inventory once the data source is configured."
        }
      />
    );
  }
  if (results.status === "error") {
    return (
      <RouteSafeNotice
        title="We could not load inventory"
        message={results.message ?? "Please adjust your filters and try again."}
      />
    );
  }
  if (results.status === "empty" || results.cards.length === 0) {
    return <EmptyDiscoveryState />;
  }
  return (
    <div className="discovery-grid">
      {results.cards.map((card) => (
        <DiscoveryCard key={card.id} card={card} />
      ))}
    </div>
  );
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = parseDiscoverySearchParams(params);
  const results = await loadDiscoveryResults(query);

  return (
    <main className="page-shell discover">
      <header className="hero">
        <p className="hero__eyebrow">BidSpace marketplace</p>
        <h1 className="hero__title">Discover inventory units to bid on</h1>
        <p className="hero__subtitle">
          Browse vendor spaces, sponsor assets, service slots, and advertising placements
          from curated hosts. Every bid is sealed, and the host selects the winner.
        </p>
      </header>

      <FilterPanel query={query} />

      <section className="discover__summary">
        <h2 className="discover__count">
          {results.total} {results.total === 1 ? "unit" : "units"} available
        </h2>
        <p className="discover__mode">{describeQuery(query)}</p>
      </section>

      <div className="discover__layout">
        <section className="discover__results" aria-label="Inventory results">
          <ResultsBody results={results} />
        </section>
        <MapPreview points={results.points} center={results.center} />
      </div>
    </main>
  );
}
