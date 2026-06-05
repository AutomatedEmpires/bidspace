import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveDiscoverySearchState, formatInventoryUnitStatusLabel, getInventoryUnitCoordinates } from "./discovery";

test("maps discovery search params into the canonical NearbyUnitsParams contract", () => {
  const state = resolveDiscoverySearchState({
    lat: "34.0522",
    lng: "-118.2437",
    radius: "5000",
    limit: "24",
    type: "vendor_space",
    commerceLayer: "physical_sales",
  });

  assert.equal(state.error, null);
  assert.equal(state.hasSearch, true);
  assert.deepEqual(state.params, {
    latitude: 34.0522,
    longitude: -118.2437,
    radiusMeters: 5000,
    limit: 24,
    type: "vendor_space",
    commerceLayer: "physical_sales",
  });
});

test("returns an idle discovery state when coordinates are absent", () => {
  const state = resolveDiscoverySearchState({});

  assert.equal(state.hasSearch, false);
  assert.equal(state.params, null);
  assert.equal(state.error, null);
});

test("formats inventory unit statuses for discovery cards", () => {
  assert.equal(formatInventoryUnitStatusLabel("receiving_bids"), "Receiving Bids");
  assert.equal(formatInventoryUnitStatusLabel("payment_pending"), "Payment Pending");
});

test("maps geojson coordinates into view-friendly latitude and longitude", () => {
  const coordinates = getInventoryUnitCoordinates({
    location: {
      type: "Point",
      coordinates: [-118.2437, 34.0522],
    },
  });

  assert.deepEqual(coordinates, {
    latitude: 34.0522,
    longitude: -118.2437,
  });
});