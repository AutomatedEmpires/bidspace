import type { ClerkMiddlewareAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Default-public: marketing and discovery surfaces never require a session.
// Only the cockpit + onboarding prefixes force sign-in.
const PROTECTED_PATH_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/host",
  "/admin",
  "/bids",
  "/bookings",
  "/saved",
  "/business",
  "/messages",
  "/discover",
] as const;

export function isProtectedRequest(request: NextRequest): boolean {
  const pathname = request.nextUrl.pathname;
  // The onboarding page owns its sign-in fallback so it does not depend on
  // Clerk's proxy redirect behavior. Nested onboarding actions remain protected.
  if (pathname === "/onboarding") return false;
  return PROTECTED_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
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
