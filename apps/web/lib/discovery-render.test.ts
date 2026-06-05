import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { DiscoveredUnit } from "@bidspace/services";
import { DiscoveryEmptyState } from "@/components/discovery/discovery-empty-state";
import { ListingCard } from "@/components/discovery/listing-card";

const unit: DiscoveredUnit = {
  id: "unit_1",
  opportunityId: "opp_1",
  organizationId: "org_1",
  name: "Corner Booth",
  type: "vendor_space",
  status: "receiving_bids",
  commerceLayer: "physical_sales",
  minimumBidCents: 5000,
  longitude: -118.2437,
  latitude: 34.0522,
  distanceMeters: 1609.344,
};

test("renders a listing card with a detail-route link and status chip", () => {
  const html = renderToStaticMarkup(React.createElement(ListingCard, { unit }));

  assert.match(html, /Corner Booth/);
  assert.match(html, /Receiving Bids/);
  assert.match(html, /\/discover\/unit_1/);
});

test("renders the active-search empty state", () => {
  const html = renderToStaticMarkup(React.createElement(DiscoveryEmptyState, { hasActiveSearch: true }));

  assert.match(html, /No inventory units matched this search\./);
});