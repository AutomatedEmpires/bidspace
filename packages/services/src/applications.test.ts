import test from "node:test";
import assert from "node:assert/strict";
import { canTransitionApplication } from "./applications";

test("applications follow a host-curated review path", () => {
  assert.equal(canTransitionApplication("submitted", "under_review"), true);
  assert.equal(canTransitionApplication("under_review", "shortlisted"), true);
  assert.equal(canTransitionApplication("shortlisted", "approved"), true);
  assert.equal(canTransitionApplication("waitlisted", "approved"), true);
});

test("terminal application decisions cannot be reopened implicitly", () => {
  assert.equal(canTransitionApplication("approved", "declined"), false);
  assert.equal(canTransitionApplication("declined", "shortlisted"), false);
  assert.equal(canTransitionApplication("withdrawn", "submitted"), false);
});
