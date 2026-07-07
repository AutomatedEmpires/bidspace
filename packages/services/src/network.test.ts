import { test } from "node:test";
import assert from "node:assert/strict";
import { canSeeOpportunity } from "./network";

const host = "11111111-1111-1111-1111-111111111111";
const vendor = "22222222-2222-2222-2222-222222222222";

test("public opportunities are visible to everyone, signed in or not", () => {
  const opp = { visibility: "public" as const, organization_id: host };
  assert.ok(canSeeOpportunity(opp, { viewerOrganizationId: null, isActiveNetworkMember: false, isInvited: false }));
  assert.ok(canSeeOpportunity(opp, { viewerOrganizationId: vendor, isActiveNetworkMember: false, isInvited: false }));
});

test("network opportunities require active membership or an invitation", () => {
  const opp = { visibility: "network" as const, organization_id: host };
  assert.equal(
    canSeeOpportunity(opp, { viewerOrganizationId: vendor, isActiveNetworkMember: false, isInvited: false }),
    false,
  );
  assert.ok(canSeeOpportunity(opp, { viewerOrganizationId: vendor, isActiveNetworkMember: true, isInvited: false }));
  assert.ok(canSeeOpportunity(opp, { viewerOrganizationId: vendor, isActiveNetworkMember: false, isInvited: true }));
});

test("invite-only opportunities require an invitation — network membership is not enough", () => {
  const opp = { visibility: "invite_only" as const, organization_id: host };
  assert.equal(
    canSeeOpportunity(opp, { viewerOrganizationId: vendor, isActiveNetworkMember: true, isInvited: false }),
    false,
  );
  assert.ok(canSeeOpportunity(opp, { viewerOrganizationId: vendor, isActiveNetworkMember: false, isInvited: true }));
});

test("the host always sees its own opportunity regardless of visibility", () => {
  const opp = { visibility: "invite_only" as const, organization_id: host };
  assert.ok(canSeeOpportunity(opp, { viewerOrganizationId: host, isActiveNetworkMember: false, isInvited: false }));
});
