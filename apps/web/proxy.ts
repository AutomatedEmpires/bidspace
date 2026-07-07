import { clerkMiddleware } from "@clerk/nextjs/server";
import { getRequiredEnv } from "@/lib/env";
import { handleProxyAuth } from "@/lib/proxy-auth";

export const proxy = clerkMiddleware(handleProxyAuth, {
  publishableKey: getRequiredEnv("CLERK_PUBLISHABLE_KEY"),
  secretKey: getRequiredEnv("CLERK_SECRET_KEY"),
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
