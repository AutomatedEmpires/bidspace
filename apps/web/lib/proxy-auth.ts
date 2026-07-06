import { createRouteMatcher } from "@clerk/nextjs/server";
import type { ClerkMiddlewareAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRouteMatcher = createRouteMatcher(["/dashboard(.*)", "/onboarding(.*)"]);

export function isProtectedRequest(request: NextRequest): boolean {
  return protectedRouteMatcher(request);
}

export async function handleProxyAuth(auth: ClerkMiddlewareAuth, request: NextRequest) {
  if (isProtectedRequest(request)) {
    await auth.protect();
  }

  const authState = await auth();
  const requestHeaders = new Headers(request.headers);
  if (authState.orgId) {
    requestHeaders.set("X-Org-Id", authState.orgId);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}