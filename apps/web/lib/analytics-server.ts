import "server-only";

// Server-side marketplace analytics: fire-and-forget capture to PostHog's HTTP
// API from server actions and webhooks. Zero dependencies, env-gated — without
// a key this is a no-op, and a capture failure never breaks a marketplace
// action. Distinct id is the acting organization, so funnels read as
// marketplace behaviour rather than anonymous devices.
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

export type MarketplaceEvent =
  | "opportunity_published"
  | "opportunity_duplicated"
  | "bid_submitted"
  | "bid_awarded"
  | "bid_selected_preview"
  | "application_submitted"
  | "application_reviewed"
  | "booking_paid"
  | "review_submitted"
  | "network_invited";

export function captureServerEvent(
  event: MarketplaceEvent,
  distinctId: string,
  properties: Record<string, string | number | boolean | null> = {},
): void {
  if (!POSTHOG_KEY) return;
  void fetch(`${POSTHOG_HOST}/capture/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: POSTHOG_KEY,
      event,
      distinct_id: distinctId,
      properties: { source: "server", ...properties },
    }),
  }).catch(() => {
    // Analytics must never take down a marketplace action.
  });
}
