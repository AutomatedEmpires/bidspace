# BidSpace — Production Activation Checklist

**Status as of 2026-07-07.** The application is code-complete, typechecks,
passes 62 tests + a green build, and runs against a **live Supabase project**
with a proven internal marketplace loop. What remains to reach a *public,
authenticated, money-moving* production environment is a set of **external
account activations that require founder identity or dashboard access** — none
are code work. This document is the exact, minimal checklist.

## What is already done (no action needed)

- **Supabase** — project `bidspace` (`hnjjcgxflxlfsqslgxcv`, us-west-1).
  Migrations `0001`–`0011` applied, demo seed loaded, advisor hardening applied.
  Keys live in Doppler `bidspace/dev` and `apps/web/.env.local`.
- **Doppler** — project `bidspace` exists (`dev` / `stg` / `prd` configs).
- **Stripe Connect code** — controller-property accounts + destination charges +
  idempotent webhook. See `docs/CONNECT-RUNBOOK.md` (D028).
- **Analytics code** — server events + client pageview provider, env-gated.
- **Proven** — `tools/live-loop-check.ts` (full bid→award→booking→payment→
  settlement, exact 10% split) and `tools/live-duplicate-check.ts` both PASS
  against the live DB.

## The exact environment variables production needs

Set these in **Doppler `bidspace/prd`** (Vercel pulls from Doppler, or mirror
into Vercel project env). `NEXT_PUBLIC_*` are exposed to the browser by design.

| Variable | Source | Blocking? |
|---|---|---|
| `SUPABASE_URL` | ✅ already have | no |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ already have | no |
| `SUPABASE_ANON_KEY` | ✅ already have | no |
| `NEXT_PUBLIC_SITE_URL` | set to the production host | no (set at deploy) |
| `CLERK_PUBLISHABLE_KEY` | **Clerk dashboard** | **founder** |
| `CLERK_SECRET_KEY` | **Clerk dashboard** | **founder** |
| `CLERK_ENCRYPTION_KEY` | `openssl rand -hex 32` (REQUIRED in prod — see note) | no |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | **Mapbox dashboard** (restrict to prod host) | **founder** |
| `STRIPE_SECRET_KEY` | **Stripe dashboard** (test then live) | **founder** |
| `STRIPE_WEBHOOK_SECRET` | **Stripe webhook endpoint** | **founder** |
| `NEXT_PUBLIC_POSTHOG_KEY` | **PostHog project** | **founder** |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` (default) | no |
| `ADMIN_USER_IDS` | comma-sep Clerk user ids for platform admins | founder (after Clerk) |

> **CLERK_ENCRYPTION_KEY is mandatory in production.** `apps/web/proxy.ts`
> passes `secretKey` explicitly to `clerkMiddleware`, so Clerk requires an
> encryption key to propagate it — without it *every request 500s*. This was
> found by running the production build locally. Generate once with
> `openssl rand -hex 32`.

## Founder activation steps (in dependency order)

### 1. Clerk (unblocks auth, deploy, and all E2E) — HARD BLOCKER
There is no Clerk API/CLI/MCP available to this agent; the dashboard requires
interactive login. **Founder must:**
1. Create a Clerk application "BidSpace" at dashboard.clerk.com.
2. **Organizations**: enable Organizations (the app is org-first — every user
   acts through an org). Allow users to create organizations.
3. **Paths**: sign-in `/sign-in`, sign-up `/sign-up`, after sign-in `/dashboard`,
   after sign-up `/onboarding`.
4. Add the production origin to **allowed origins**.
5. Copy Publishable + Secret keys → Doppler `bidspace/prd`
   (`CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`). Add a `CLERK_ENCRYPTION_KEY`.
6. (Optional, for admin) set `publicMetadata.bidspaceAdmin = true` on your own
   Clerk user, or add your Clerk user id to `ADMIN_USER_IDS`.

### 2. Stripe Connect — HARD BLOCKER (KYC)
Follow `docs/CONNECT-RUNBOOK.md`. Unavoidable founder step: platform KYC / EIN /
beneficial owners / bank. Code is done.

### 3. Mapbox — token only
The Mapbox integration available to this agent has an invalid token and cannot
mint one. **Founder:** create a **public** token at account.mapbox.com, restrict
it to the production hostname (URL restriction), set `NEXT_PUBLIC_MAPBOX_TOKEN`.
Verify `/map` renders and shows the seeded units. (Until set, `/map` shows a
clean "map not configured" state — it does not crash.)

### 4. PostHog — project only (code done)
**Founder:** create a BidSpace project at us.posthog.com, copy the Project API
key → `NEXT_PUBLIC_POSTHOG_KEY`. Server events (`bid_submitted`, `bid_awarded`,
`booking_paid`, `opportunity_published`, `opportunity_duplicated`,
`review_submitted`, `network_invited`) and client `$pageview` then flow
automatically — no code change. Verify events appear in PostHog → Activity.

### 5. Sentry — project + wiring
Not yet wired in code (kept out to avoid shipping unverifiable, build-risky
config). To add: `pnpm --filter @bidspace/web add @sentry/nextjs`, run
`npx @sentry/wizard@latest -i nextjs`, set `SENTRY_DSN` /
`NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_AUTH_TOKEN` in Doppler. Mirror the
env-gated pattern in `apps/web/lib/analytics-server.ts` so no DSN = no-op.

### 6. Vercel deploy — ready, gated on Clerk
Team **AutomatedEmpires** (`team_0IgwjPKkR3NmPUC5ugTK3cfi`). The repo builds
green. A deploy **before** real Clerk keys exist will serve 500s on every route
(ClerkProvider + middleware), so **deploy only after step 1**. Then:
1. Import `AutomatedEmpires/bidspace` into a Vercel project (root `apps/web`,
   framework Next.js, build via Turborepo).
2. Wire Doppler → Vercel env (or copy `bidspace/prd` values into Vercel).
3. Set `NEXT_PUBLIC_SITE_URL` to the assigned `*.vercel.app` host (safe
   temporary hostname — no premium domain).
4. Deploy from `main` (merge `integration/recovered-bidspace-product` first via
   PR — builder is not the approver, per AGENTS.md).
5. Verify: HTTPS, `/` + `/explore` + `/map` render, sign-up works, protected
   routes gate, `/api/stripe/webhook` reachable, PostHog receives events.

## Canonical browser E2E (after steps 1–2, 6)

Host signs up → onboards → creates venue → publishes opportunity + unit →
opens bidding. Vendor signs up → browses → bids. Host shortlists → counters.
Vendor accepts → pays (Stripe test card). Booking is created, fee is 10%,
payout state correct. This is the completion proof.

## Definition of OPERATING

- [ ] Real host identity works (Clerk)
- [ ] Real vendor identity works (Clerk)
- [ ] Public marketplace reachable over HTTPS (Vercel)
- [ ] Real Connect onboarding works (Stripe)
- [ ] External money flow proven, 10% fee + payout correct (Stripe)
- [ ] Maps render on prod host (Mapbox)
- [ ] Analytics + errors observable (PostHog, Sentry)

Every unchecked item is a founder account action above, not code.
