import { test } from "node:test";
import assert from "node:assert/strict";
import { assessFit } from "./fit";

const openOpportunity = {
  category_tags: ["food", "beverage"],
  bid_deadline: new Date(Date.now() + 86_400_000).toISOString(),
  status: "receiving_bids",
} as Parameters<typeof assessFit>[1];

test("strong fit when categories match, utilities line up, and docs are on file", () => {
  const report = assessFit(
    { categoryTags: ["food"], powerNeeds: true, verifiedDocumentTypes: ["insurance"] },
    openOpportunity,
    {
      category_restrictions: ["food"],
      power_available: true,
      water_available: null,
      required_documents: ["insurance"],
    },
  );
  assert.equal(report.level, "strong");
  assert.ok(report.eligibility.every((c) => c.ok));
  assert.ok(report.operational.every((c) => c.ok));
  assert.equal(report.attention.length, 0);
});

test("blocked when the unit restricts categories the vendor does not have", () => {
  const report = assessFit(
    { categoryTags: ["retail"] },
    openOpportunity,
    {
      category_restrictions: ["food"],
      power_available: null,
      water_available: null,
      required_documents: [],
    },
  );
  assert.equal(report.level, "blocked");
  const category = report.eligibility.find((c) => c.key === "category");
  assert.equal(category?.ok, false);
});

test("blocked when the submission deadline has passed", () => {
  const report = assessFit(
    { categoryTags: ["food"] },
    {
      category_tags: [],
      bid_deadline: new Date(Date.now() - 3_600_000).toISOString(),
      status: "receiving_bids",
    } as Parameters<typeof assessFit>[1],
    null,
  );
  assert.equal(report.level, "blocked");
});

test("review level when the position lacks required power", () => {
  const report = assessFit(
    { categoryTags: ["food"], powerNeeds: true },
    openOpportunity,
    {
      category_restrictions: [],
      power_available: false,
      water_available: null,
      required_documents: [],
    },
  );
  assert.equal(report.level, "review");
  const power = report.operational.find((c) => c.key === "power");
  assert.equal(power?.ok, false);
});

test("possible level when only missing documents need attention", () => {
  const report = assessFit(
    { categoryTags: ["food"], verifiedDocumentTypes: [] },
    openOpportunity,
    {
      category_restrictions: ["food"],
      power_available: null,
      water_available: null,
      required_documents: ["insurance", "food_permit"],
    },
  );
  assert.equal(report.level, "possible");
  assert.equal(report.attention.length, 1);
  assert.match(report.attention[0] ?? "", /insurance/);
});
