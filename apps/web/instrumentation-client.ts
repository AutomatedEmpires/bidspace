import * as Sentry from "@sentry/nextjs";

// Browser init. Uses NEXT_PUBLIC_SENTRY_DSN (must be inlined at build time,
// same rule as every other NEXT_PUBLIC_* var in this app). No key => inert.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.2,
    sendDefaultPii: false,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
