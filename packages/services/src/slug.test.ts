import { test } from "node:test";
import assert from "node:assert/strict";
import { refFromSlug, slugWithRef, slugify } from "./slug";

test("slugify lowercases, strips punctuation, and collapses runs", () => {
  assert.equal(slugify("Downtown Summer Market!"), "downtown-summer-market");
  assert.equal(slugify("  Food & Truck  Row  "), "food-truck-row");
});

test("slugWithRef embeds a stable short ref from the id", () => {
  const id = "9f3a21c4-0000-4000-8000-000000000000";
  const slug = slugWithRef("Downtown Summer Market", id);
  assert.equal(slug, "downtown-summer-market-9f3a21c4");
});

test("slugWithRef survives an all-punctuation title", () => {
  const id = "9f3a21c4-0000-4000-8000-000000000000";
  assert.equal(slugWithRef("!!!", id), "9f3a21c4");
});

test("refFromSlug passes uuids through and extracts short refs", () => {
  const id = "9f3a21c4-0000-4000-8000-000000000000";
  assert.equal(refFromSlug(id), id);
  assert.equal(refFromSlug("downtown-summer-market-9f3a21c4"), "9f3a21c4");
});
