"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";

// PostHog is enabled only when NEXT_PUBLIC_POSTHOG_KEY is present; without it
// this provider is inert so local/dev environments never emit phantom events.
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

let initialized = false;

function ensurePosthog(): boolean {
  if (!POSTHOG_KEY) return false;
  if (!initialized) {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: false, // captured manually below so App Router routes are correct
      persistence: "localStorage+cookie",
    });
    initialized = true;
  }
  return true;
}

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!ensurePosthog()) return;
    posthog.capture("$pageview", { $current_url: window.location.href });
  }, [pathname, searchParams]);

  return <>{children}</>;
}

// Fire a product event from any client component; no-ops without a key.
export function captureEvent(event: string, properties?: Record<string, unknown>) {
  if (!ensurePosthog()) return;
  posthog.capture(event, properties);
}
