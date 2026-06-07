import Link from "next/link";

import type { DiscoveryMapPoint, MapCenter } from "../../lib/discovery";

interface MapPreviewProps {
  points: DiscoveryMapPoint[];
  center: MapCenter;
}

interface PlottedPoint {
  point: DiscoveryMapPoint;
  left: number;
  top: number;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 50;
  return Math.min(96, Math.max(4, value));
}

function plotPoints(points: DiscoveryMapPoint[], center: MapCenter): PlottedPoint[] {
  if (points.length === 0) return [];

  const lats = points.map((point) => point.latitude);
  const lngs = points.map((point) => point.longitude);
  const minLat = Math.min(...lats, center.latitude);
  const maxLat = Math.max(...lats, center.latitude);
  const minLng = Math.min(...lngs, center.longitude);
  const maxLng = Math.max(...lngs, center.longitude);

  // Pad the extent so points are never glued to the edge, and avoid div-by-zero
  // when every point shares a coordinate.
  const latSpan = maxLat - minLat || 1;
  const lngSpan = maxLng - minLng || 1;

  return points.map((point) => ({
    point,
    left: clampPercent(((point.longitude - minLng) / lngSpan) * 100),
    top: clampPercent(((maxLat - point.latitude) / latSpan) * 100),
  }));
}

export function MapPreview({ points, center }: MapPreviewProps) {
  const plotted = plotPoints(points, center);

  return (
    <aside className="map-preview" aria-label="Map preview of discoverable inventory">
      <div className="map-preview__canvas">
        <div className="map-preview__grid" aria-hidden="true" />
        {plotted.length === 0 ? (
          <p className="map-preview__empty">No mappable inventory in view yet.</p>
        ) : (
          plotted.map(({ point, left, top }) => (
            <Link
              key={point.id}
              href={point.href}
              className="map-preview__pin"
              style={{ left: `${left}%`, top: `${top}%` }}
              title={`${point.name} \u00b7 ${point.priceLabel}`}
            >
              <span className="map-preview__pin-dot" aria-hidden="true" />
              <span className="map-preview__pin-label">{point.name}</span>
            </Link>
          ))
        )}
      </div>
      <p className="map-preview__footnote">
        Showing {plotted.length} mappable {plotted.length === 1 ? "unit" : "units"}. A full
        interactive map is coming to this surface.
      </p>
    </aside>
  );
}
