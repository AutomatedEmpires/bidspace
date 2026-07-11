import { defineConfig, devices } from "@playwright/test";

// E2E runs against a deployed, fully-credentialed BidSpace (real Clerk + Stripe
// test mode). It is intentionally inert until BIDSPACE_E2E_BASE_URL is set, so
// it never runs in CI/local without a target — the spec self-skips (see
// e2e/marketplace-loop.spec.ts). Run with:
//   BIDSPACE_E2E_BASE_URL=https://<host> \
//   BIDSPACE_E2E_HOST_EMAIL=... BIDSPACE_E2E_HOST_PASSWORD=... \
//   BIDSPACE_E2E_VENDOR_EMAIL=... BIDSPACE_E2E_VENDOR_PASSWORD=... \
//   pnpm --filter @bidspace/web e2e
const baseURL = process.env.BIDSPACE_E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
