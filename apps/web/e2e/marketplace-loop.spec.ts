import { test, expect, type Page } from "@playwright/test";

/**
 * Canonical marketplace loop — the single E2E that matters (mandate item 7).
 *
 * host signs in → publishes a space → vendor discovers and bids → host
 * shortlists and selects for placement planning → vendor sees the preview
 * selection. No payment, booking, or binding commitment is created.
 *
 * GATING: this suite is skipped unless a fully-credentialed target is provided
 * via env. It requires a deployed BidSpace with a real Clerk instance (password
 * auth enabled). It is complete logic, not a stub — it needs credentials, not
 * more design. Payment credentials are deliberately irrelevant.
 */

const BASE = process.env.BIDSPACE_E2E_BASE_URL;
const HOST_EMAIL = process.env.BIDSPACE_E2E_HOST_EMAIL;
const HOST_PASSWORD = process.env.BIDSPACE_E2E_HOST_PASSWORD;
const VENDOR_EMAIL = process.env.BIDSPACE_E2E_VENDOR_EMAIL;
const VENDOR_PASSWORD = process.env.BIDSPACE_E2E_VENDOR_PASSWORD;

const CREDENTIALED = Boolean(
  BASE && HOST_EMAIL && HOST_PASSWORD && VENDOR_EMAIL && VENDOR_PASSWORD,
);

// Sign in an existing test user through the Clerk-hosted form. (Sign-up with
// email verification is exercised manually per the runbook; automated runs use
// pre-provisioned test users with password auth — see docs/PRODUCTION-ACTIVATION.md.)
async function signIn(page: Page, email: string, password: string) {
  await page.goto("/sign-in");
  await page.getByLabel(/email/i).fill(email);
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /continue|sign in/i }).click();
  await page.waitForURL(/\/(dashboard|host|discover|onboarding)/);
}

async function signOut(page: Page) {
  await page.goto("/");
  // Clerk <UserButton> → Sign out; fall back to clearing storage if absent.
  const userButton = page.getByRole("button", { name: /open user button|account/i });
  if (await userButton.isVisible().catch(() => false)) {
    await userButton.click();
    await page.getByRole("menuitem", { name: /sign out/i }).click();
  }
  await page.context().clearCookies();
}

test.describe("canonical marketplace loop", () => {
  test.skip(!CREDENTIALED, "Set BIDSPACE_E2E_BASE_URL + host/vendor credentials to run.");

  // Unique title so re-runs don't collide on slug/state.
  const stamp = process.env.BIDSPACE_E2E_STAMP ?? "e2e";
  const opportunityTitle = `E2E Night Market ${stamp}`;

  test("host publishes, vendor bids, host selects without creating payment", async ({
    page,
  }) => {
    // ---- HOST: publish an opportunity with one unit --------------------------
    await signIn(page, HOST_EMAIL!, HOST_PASSWORD!);

    // A location is required before a release; reuse the first if present.
    await page.goto("/host/venues");
    if (await page.getByRole("link", { name: /add.*location/i }).isVisible().catch(() => false)) {
      const anyVenue = page.getByRole("link", { name: /manage/i }).first();
      if (!(await anyVenue.isVisible().catch(() => false))) {
        await page.getByRole("link", { name: /add.*location/i }).first().click();
        await page.getByLabel(/location name/i).fill(`E2E Venue ${stamp}`);
        await page.getByLabel(/street address/i).fill("1335 W Summit Pkwy");
        await page.getByLabel(/^city/i).fill("Spokane");
        await page.getByLabel(/^state/i).fill("WA");
        await page.getByLabel(/latitude/i).fill("47.6647");
        await page.getByLabel(/longitude/i).fill("-117.4324");
        await page.getByRole("button", { name: /create location/i }).click();
      }
    }

    await page.goto("/host/opportunities/new");
    await page.getByLabel(/^title/i).fill(opportunityTitle);
    await page.getByLabel(/floor price/i).fill("220.00");
    await page.getByRole("button", { name: /save draft/i }).click();

    // On the manage page, add a position, then publish + open bidding.
    await expect(page.getByRole("heading", { name: opportunityTitle })).toBeVisible();
    await page.getByRole("button", { name: /add a position/i }).click().catch(() => {});
    await page.getByLabel(/^name/i).first().fill(`Stall ${stamp}`);
    await page.getByLabel(/floor \(usd\)/i).fill("220.00");
    await page.getByRole("button", { name: /add position/i }).click();
    await page.getByRole("button", { name: /^publish$/i }).click();
    await page.getByRole("button", { name: /open bidding/i }).click();
    await signOut(page);

    // ---- VENDOR: discover + bid ---------------------------------------------
    await signIn(page, VENDOR_EMAIL!, VENDOR_PASSWORD!);
    await page.goto("/explore");
    await page.getByRole("link", { name: opportunityTitle }).click();
    await page.getByRole("link", { name: /view & bid|view position/i }).first().click();
    await page.getByLabel(/your offer/i).fill("280");
    await page.getByRole("button", { name: /submit sealed bid/i }).click();
    await expect(page.getByText(/bid submitted/i)).toBeVisible();
    await signOut(page);

    // ---- HOST: review → non-binding preview selection -----------------------
    await signIn(page, HOST_EMAIL!, HOST_PASSWORD!);
    await page.goto("/host/bids");
    const bidCard = page.locator("section", { hasText: /bids needing review/i });
    await bidCard.getByRole("button", { name: /shortlist/i }).first().click().catch(() => {});
    await page.getByRole("button", { name: /select for placement planning/i }).first().click();
    await signOut(page);

    // ---- VENDOR: selection is visible; no checkout exists -------------------
    await signIn(page, VENDOR_EMAIL!, VENDOR_PASSWORD!);
    await page.goto("/bids");
    await expect(page.getByText(/accepted/i).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /pay|checkout/i })).toHaveCount(0);
  });
});
