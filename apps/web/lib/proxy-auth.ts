import type { ClerkMiddlewareAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATH_PREFIXES = ["/dashboard", "/onboarding"] as const;

export function isProtectedRequest(request: NextRequest): boolean {
  const pathname = request.nextUrl.pathname;
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
