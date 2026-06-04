import { test } from "node:test";
import assert from "node:assert/strict";
import { hasOrgRole, normalizeMembershipRole } from "./permissions";

test("normalizes clerk org role prefix", () => {
  assert.equal(normalizeMembershipRole("org:admin"), "admin");
});

test("enforces role hierarchy", () => {
  assert.equal(hasOrgRole("member", "org:manager"), true);
  assert.equal(hasOrgRole("admin", "member"), false);
});
