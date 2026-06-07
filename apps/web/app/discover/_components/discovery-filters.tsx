import { COMMERCE_LAYER, INVENTORY_UNIT_TYPE } from "@bidspace/core";
import {
  COMMERCE_LAYER_LABELS,
  UNIT_TYPE_LABELS,
  type DiscoveryFilters,
} from "@/lib/discovery-filters";

interface DiscoveryFiltersProps {
  filters: DiscoveryFilters;
}

export function DiscoveryFilters({ filters }: DiscoveryFiltersProps) {
  return (
    <aside className="filters-panel" aria-label="Discovery filters">
      <div>
        <p className="eyebrow">Discovery controls</p>
        <h2>Browse by unit, layer, and place.</h2>
      </div>

      <form className="filter-grid" action="/discover">
        <div className="field">
          <label htmlFor="q">Search</label>
          <input id="q" name="q" defaultValue={filters.q} placeholder="Booth, sponsor, parking, Austin…" />
        </div>

        <div className="field">
          <label htmlFor="type">Inventory unit type</label>
          <select id="type" name="type" defaultValue={filters.type ?? ""}>
            <option value="">All unit types</option>
            {INVENTORY_UNIT_TYPE.map((type) => (
              <option key={type} value={type}>
                {UNIT_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="commerceLayer">Commerce layer</label>
          <select id="commerceLayer" name="commerceLayer" defaultValue={filters.commerceLayer ?? ""}>
            <option value="">All commerce layers</option>
            {COMMERCE_LAYER.map((layer) => (
              <option key={layer} value={layer}>
                {COMMERCE_LAYER_LABELS[layer]}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="mode">Location mode</label>
          <select id="mode" name="mode" defaultValue={filters.locationMode}>
            <option value="viewport">Viewport / map bounds</option>
            <option value="radius">Radius from point</option>
          </select>
          <p className="field-hint">Map clients can pass minLat, minLng, maxLat, and maxLng. Radius clients can pass lat, lng, and radiusMiles.</p>
        </div>

        <div className="radius-grid">
          <div className="field">
            <label htmlFor="lat">Latitude</label>
            <input id="lat" name="lat" inputMode="decimal" defaultValue={filters.latitude ?? ""} placeholder="39.8283" />
          </div>
          <div className="field">
            <label htmlFor="lng">Longitude</label>
            <input id="lng" name="lng" inputMode="decimal" defaultValue={filters.longitude ?? ""} placeholder="-98.5795" />
          </div>
        </div>

        <div className="field">
          <label htmlFor="radiusMiles">Radius miles</label>
          <input id="radiusMiles" name="radiusMiles" inputMode="numeric" defaultValue={filters.radiusMiles} />
        </div>

        <details>
          <summary className="badge">Viewport parameters</summary>
          <div className="viewport-grid" style= marginTop: 10 >
            <div className="field">
              <label htmlFor="minLat">Min lat</label>
              <input id="minLat" name="minLat" inputMode="decimal" defaultValue={filters.minLatitude ?? ""} />
            </div>
            <div className="field">
              <label htmlFor="minLng">Min lng</label>
              <input id="minLng" name="minLng" inputMode="decimal" defaultValue={filters.minLongitude ?? ""} />
            </div>
            <div className="field">
              <label htmlFor="maxLat">Max lat</label>
              <input id="maxLat" name="maxLat" inputMode="decimal" defaultValue={filters.maxLatitude ?? ""} />
            </div>
            <div className="field">
              <label htmlFor="maxLng">Max lng</label>
              <input id="maxLng" name="maxLng" inputMode="decimal" defaultValue={filters.maxLongitude ?? ""} />
            </div>
          </div>
        </details>

        <div className="filter-actions">
          <button type="submit" className="button button-primary">Apply filters</button>
          <a href="/discover" className="button button-ghost">Reset</a>
        </div>
      </form>
    </aside>
  );
}
