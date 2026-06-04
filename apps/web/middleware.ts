import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/onboarding(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  const authState = await auth();
  const requestHeaders = new Headers(req.headers);
  if (authState.orgId) {
    requestHeaders.set("X-Org-Id", authState.orgId);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}, {
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
});

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico)).*)", "/(api|trpc)(.*)"],
};
