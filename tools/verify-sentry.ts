/**
 * Fires one clearly-labeled, harmless test event at the configured Sentry DSN
 * and waits for the flush, so we can confirm delivery rather than assume it.
 *
 * Run:  set -a && source apps/web/.env.local && set +a && \
 *       pnpm --filter @bidspace/web exec tsx ../../tools/verify-sentry.ts
 */
import * as Sentry from "@sentry/node";

const dsn = process.env.SENTRY_DSN;
if (!dsn) {
  console.error("FAIL: SENTRY_DSN not set");
  process.exit(1);
}

Sentry.init({ dsn, tracesSampleRate: 0 });

const marker = `bidspace-sentry-verify-${new Date().toISOString()}`;
Sentry.captureException(new Error(`[verification] ${marker} — safe to ignore/resolve`));

Sentry.flush(5000).then((sent) => {
  console.log(sent ? `== PASS: event sent (${marker}) ==` : "== FAIL: flush timed out ==");
  process.exit(sent ? 0 : 1);
});
