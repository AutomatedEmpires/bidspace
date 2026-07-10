import * as Sentry from "@sentry/nextjs";

// Server + edge runtime init. Env-gated: no SENTRY_DSN => Sentry.init is a
// documented no-op, matching every other integration's degrade-honestly rule.
export async function register() {
  if (!process.env.SENTRY_DSN) return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.2,
      // Marketplace data (bids, org names, payment amounts) must never ride
      // along on an error report — request bodies/headers are not attached.
      sendDefaultPii: false,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.2,
      sendDefaultPii: false,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
