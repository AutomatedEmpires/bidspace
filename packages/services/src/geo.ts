// Helpers for the PostGIS geography(Point,4326) columns, which are exposed as
// GeoJSON over the API. GeoJSON coordinate order is [longitude, latitude].

export interface GeoPoint {
  type: "Point";
  coordinates: [number, number];
}

export function toGeoPoint(
  latitude: number | undefined,
  longitude: number | undefined,
): GeoPoint | null {
  if (latitude == null || longitude == null) return null;
  return { type: "Point", coordinates: [longitude, latitude] };
}
