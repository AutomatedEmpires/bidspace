import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import type { ClerkMiddlewareAuth } from "@clerk/nextjs/server";
import { handleProxyAuth, isProtectedRequest } from "./proxy-auth";

function createAuth(orgId: string | null = null) {
  let protectCalls = 0;

  const auth = Object.assign(async () => ({ orgId }), {
    protect: async () => {
      protectCalls += 1;
    },
    getProtectCalls: () => protectCalls,
  }) as unknown as ClerkMiddlewareAuth & { getProtectCalls: () => number };

  return auth;
}

function createRequest(pathname: string) {
  return new NextRequest(`https://bidspace.local${pathname}`);
}

test("matches protected dashboard and onboarding routes with native pathname checks", () => {
  assert.equal(isProtectedRequest(createRequest("/dashboard")), true);
  assert.equal(isProtectedRequest(createRequest("/dashboard/settings")), true);
  assert.equal(isProtectedRequest(createRequest("/onboarding/complete")), true);
  assert.equal(isProtectedRequest(createRequest("/discover")), false);
});

test("protects dashboard requests and forwards org id", async () => {
  const auth = createAuth("org_123");
  const request = createRequest("/dashboard");

  const response = await handleProxyAuth(auth, request);

  assert.equal(auth.getProtectCalls(), 1);
  assert.equal(response.headers.get("x-middleware-next"), "1");
  assert.equal(response.headers.get("x-middleware-request-x-org-id"), "org_123");
});

test("skips auth protection for public discovery requests", async () => {
  const auth = createAuth(null);
  const request = createRequest("/discover");

  const response = await handleProxyAuth(auth, request);

  assert.equal(auth.getProtectCalls(), 0);
  assert.equal(response.headers.get("x-middleware-next"), "1");
  assert.equal(response.headers.get("x-middleware-request-x-org-id"), null);
});
