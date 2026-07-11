import type { Metadata } from "next";
import { ExploreMap } from "@/components/explore-map";

export const metadata: Metadata = {
  title: "Map — spatial discovery",
  description: "See open commercial positions on the map: booths, pads, kiosks, and placements.",
};

export default function MapPage() {
  return (
    <div className="h-[calc(100dvh-4rem)]">
      <ExploreMap />
    </div>
  );
}
