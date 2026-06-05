import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";

export function DiscoveryEmptyState({ hasActiveSearch }: { hasActiveSearch: boolean }) {
  return (
    <Card style={{ textAlign: "center" }}>
      <h2 style={{ fontSize: 24, marginBottom: 12 }}>
        {hasActiveSearch ? "No inventory units matched this search." : "Start with a market search."}
      </h2>
      <p style={{ maxWidth: 560, margin: "0 auto 20px", lineHeight: 1.6, opacity: 0.8 }}>
        {hasActiveSearch
          ? "The discovery service returned zero available or receiving-bids inventory units for the current filters. Adjust the radius or broaden your filters."
          : "BidSpace discovery is wired to the canonical search service. Enter coordinates or use one of the starter market links to query live inventory units."}
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
        <ButtonLink href="/discover?lat=34.0522&lng=-118.2437&radius=7500">Search Los Angeles</ButtonLink>
        <ButtonLink href="/discover?lat=32.7767&lng=-96.797&radius=7500">Search Dallas</ButtonLink>
      </div>
    </Card>
  );
}