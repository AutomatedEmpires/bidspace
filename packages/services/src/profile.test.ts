import { test } from "node:test";
import assert from "node:assert/strict";
import { vendorProfileCompleteness } from "./profile";

const org = { name: "Pinecrafted Goods", logo_url: null };

test("an empty profile is only name-complete", () => {
  const c = vendorProfileCompleteness({ organization: org, profile: null, documents: [] });
  assert.equal(c.total, 7);
  assert.equal(c.doneCount, 1); // name (from org)
  assert.equal(c.percent, Math.round((1 / 7) * 100));
  assert.equal(c.nextUp.length, 3);
  assert.equal(c.nextUp[0]?.key, "bio");
});

test("a fully filled profile with current insurance is 100%", () => {
  const c = vendorProfileCompleteness({
    organization: { name: "Pinecrafted Goods", logo_url: "https://x/logo.png" },
    profile: {
      display_name: "Pinecrafted Goods",
      bio: "Hand-turned woodware.",
      category_tags: ["retail", "makers"],
      gallery_urls: ["https://x/1.jpg"],
      service_radius_miles: 150,
    },
    documents: [{ document_type: "insurance", status: "verified", expiration_date: "2027-01-01" }],
    now: new Date("2026-07-10T00:00:00Z"),
  });
  assert.equal(c.percent, 100);
  assert.equal(c.doneCount, 7);
  assert.equal(c.nextUp.length, 0);
});

test("expired insurance does not count", () => {
  const c = vendorProfileCompleteness({
    organization: org,
    profile: null,
    documents: [{ document_type: "insurance", status: "verified", expiration_date: "2020-01-01" }],
    now: new Date("2026-07-10T00:00:00Z"),
  });
  assert.equal(c.items.find((i) => i.key === "insurance")?.done, false);
});

test("percent is monotonic as fields are added", () => {
  const base = vendorProfileCompleteness({ organization: org, profile: null, documents: [] });
  const withBio = vendorProfileCompleteness({
    organization: org,
    profile: {
      display_name: "Pinecrafted Goods",
      bio: "Hand-turned woodware.",
      category_tags: [],
      gallery_urls: [],
      service_radius_miles: null,
    },
    documents: [],
  });
  assert.ok(withBio.percent > base.percent);
});
