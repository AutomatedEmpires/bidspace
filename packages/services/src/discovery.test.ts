import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assertCoordinate,
  assertViewport,
  normalizeRadiusMeters,
  normalizeLimit,
  mapDiscoveredUnit,
  DEFAULT_SEARCH_RADIUS_M,
  MAX_SEARCH_RADIUS_M,
  MAX_SEARCH_LIMIT,
} from "./discovery.js";
import { ValidationError } from "./errors.js";

test("assertCoordinate accepts valid lat/lng", () => {
  assert.doesNotThrow(() => assertCoordinate(34.05, -118.24));
  assert.doesNotThrow(() => assertCoordinate(-90, 180));
});

test("assertCoordinate rejects out-of-range or non-finite values", () => {
  assert.throws(() => assertCoordinate(91, 0), ValidationError);
  assert.throws(() => assertCoordinate(0, 181), ValidationError);
  assert.throws(() => assertCoordinate(Number.NaN, 0), ValidationError);
});

test("normalizeRadiusMeters defaults and clamps", () => {
  assert.equal(normalizeRadiusMeters(undefined), DEFAULT_SEARCH_RADIUS_M);
  assert.equal(normalizeRadiusMeters(1000), 1000);
  assert.equal(normalizeRadiusMeters(10_000_000), MAX_SEARCH_RADIUS_M);
  assert.throws(() => normalizeRadiusMeters(0), ValidationError);
  assert.throws(() => normalizeRadiusMeters(-5), ValidationError);
});

test("normalizeLimit defaults, clamps, and validates", () => {
  assert.equal(normalizeLimit(undefined, 100), 100);
  assert.equal(normalizeLimit(25, 100), 25);
  assert.equal(normalizeLimit(99_999, 100), MAX_SEARCH_LIMIT);
  assert.throws(() => normalizeLimit(0, 100), ValidationError);
  assert.throws(() => normalizeLimit(2.5, 100), ValidationError);
});

test("assertViewport rejects inverted bounds", () => {
  assert.doesNotThrow(() =>
    assertViewport({ minLongitude: -119, minLatitude: 33, maxLongitude: -117, maxLatitude: 35 }),
  );
  assert.throws(
    () => assertViewport({ minLongitude: -117, minLatitude: 35, maxLongitude: -119, maxLatitude: 33 }),
    ValidationError,
  );
});

test("mapDiscoveredUnit converts snake_case rpc rows to camelCase", () => {
  const unit = mapDiscoveredUnit({
    id: "u1",
    opportunity_id: "o1",
    organization_id: "org1",
    name: "Corner booth",
    type: "vendor_space",
    status: "available",
    commerce_layer: "physical_sales",
    minimum_bid_cents: 5000,
    longitude: -118.24,
    latitude: 34.05,
    distance_m: 1234.5,
  });
  assert.equal(unit.opportunityId, "o1");
  assert.equal(unit.minimumBidCents, 5000);
  assert.equal(unit.distanceMeters, 1234.5);
});
