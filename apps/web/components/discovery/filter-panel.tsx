import { COMMERCE_LAYER, INVENTORY_UNIT_TYPE } from "@bidspace/core";

import type { DiscoveryQuery } from "../../lib/discovery";

interface FilterPanelProps {
  query: DiscoveryQuery;
}

const LOCATION_MODE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "anywhere", label: "Anywhere" },
  { value: "near", label: "Near a point" },
  { value: "viewport", label: "Map viewport" },
];

const RADIUS_OPTIONS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 10000, label: "10 km" },
  { value: 25000, label: "25 km" },
  { value: 50000, label: "50 km" },
  { value: 100000, label: "100 km" },
  { value: 250000, label: "250 km" },
];

function labelize(value: string): string {
  return value
    .split(/[_\s]+/)
    .filter((part) => part.length > 0)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(" ");
}

export function FilterPanel({ query }: FilterPanelProps) {
  return (
    <form className="filter-panel" action="/discover" method="get">
      <div className="filter-panel__row">
        <label className="field field--grow">
          <span className="field__label">Search</span>
          <input
            className="field__input"
            type="search"
            name="q"
            placeholder="Search inventory units"
            defaultValue={query.search ?? ""}
          />
        </label>
        <button type="submit" className="button button--primary">
          Apply
        </button>
      </div>

      <div className="filter-panel__row">
        <label className="field">
          <span className="field__label">Unit type</span>
          <select className="field__input" name="type" defaultValue={query.unitType ?? ""}>
            <option value="">Any unit type</option>
            {INVENTORY_UNIT_TYPE.map((type) => (
              <option key={type} value={type}>
                {labelize(type)}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field__label">Commerce layer</span>
          <select className="field__input" name="layer" defaultValue={query.commerceLayer ?? ""}>
            <option value="">Any commerce layer</option>
            {COMMERCE_LAYER.map((layer) => (
              <option key={layer} value={layer}>
                {labelize(layer)}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field__label">Location</span>
          <select className="field__input" name="mode" defaultValue={query.locationMode}>
            {LOCATION_MODE_OPTIONS.map((mode) => (
              <option key={mode.value} value={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <details className="filter-panel__advanced" open={query.locationMode === "near"}>
        <summary>Search near a point</summary>
        <div className="filter-panel__row">
          <label className="field">
            <span className="field__label">Latitude</span>
            <input
              className="field__input"
              type="number"
              step="any"
              name="lat"
              placeholder="e.g. 37.7749"
              defaultValue={query.latitude ?? ""}
            />
          </label>
          <label className="field">
            <span className="field__label">Longitude</span>
            <input
              className="field__input"
              type="number"
              step="any"
              name="lng"
              placeholder="e.g. -122.4194"
              defaultValue={query.longitude ?? ""}
            />
          </label>
          <label className="field">
            <span className="field__label">Radius</span>
            <select className="field__input" name="radius" defaultValue={String(query.radiusMeters)}>
              {RADIUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </details>

      <details className="filter-panel__advanced" open={query.locationMode === "viewport"}>
        <summary>Search a map viewport</summary>
        <div className="filter-panel__row">
          <label className="field">
            <span className="field__label">Min longitude</span>
            <input className="field__input" type="number" step="any" name="minLng" defaultValue={query.viewport?.minLng ?? ""} />
          </label>
          <label className="field">
            <span className="field__label">Min latitude</span>
            <input className="field__input" type="number" step="any" name="minLat" defaultValue={query.viewport?.minLat ?? ""} />
          </label>
          <label className="field">
            <span className="field__label">Max longitude</span>
            <input className="field__input" type="number" step="any" name="maxLng" defaultValue={query.viewport?.maxLng ?? ""} />
          </label>
          <label className="field">
            <span className="field__label">Max latitude</span>
            <input className="field__input" type="number" step="any" name="maxLat" defaultValue={query.viewport?.maxLat ?? ""} />
          </label>
        </div>
      </details>
    </form>
  );
}
