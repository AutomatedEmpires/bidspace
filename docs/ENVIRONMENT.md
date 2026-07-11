# BidSpace — Production Environment Contract

The definitive inventory of every environment variable the application reads.
Derived from the code (`apps/web/lib/env.ts`, `bidspace-server.ts`, `stripe.ts`,
`safe-db.ts`, `analytics-server.ts`, `providers.tsx`, `admin-gate.ts`,
`components/explore-map.tsx`, `proxy.ts`) — not from guesswork. No secret values
appear here.

**Scope legend:** `server` = never sent to the browser; `browser` = compiled
into client bundles (must be a publishable/public value by design).
**Status legend:** ✅ have it · ⚙️ generate · 🔒 founder must supply.

## Required for a working production runtime

| Variable | Req | Scope | Owner | Status | Stored in | What breaks if absent |
|---|---|---|---|---|---|---|
| `CLERK_PUBLISHABLE_KEY` (alias `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`) | yes | browser | Clerk | 🔒 | Doppler `prd` + Vercel | `ClerkProvider`/middleware can't init → auth + all rendering fail |
| `CLERK_SECRET_KEY` | yes | server | Clerk | 🔒 | Doppler `prd` + Vercel | middleware can't authenticate → every protected route fails |
| `CLERK_ENCRYPTION_KEY` | **yes (prod)** | server | generated (`openssl rand -hex 32`) | ⚙️ | Doppler `prd` + Vercel | `proxy.ts` passes `secretKey` explicitly → Clerk **500s every request** without it |
| `SUPABASE_URL` | yes | server | Supabase | ✅ | Doppler `dev`; add to `prd` + Vercel | all data routes throw at request time |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | server 🔒🔒 | Supabase | ✅ | Doppler `dev`; add to `prd` + Vercel | all data routes throw; **this key bypasses RLS — never expose** |
| `NEXT_PUBLIC_SITE_URL` | yes | browser | deploy | ⚙️ (set to prod host) | Doppler `prd` + Vercel | Stripe success/cancel + Connect return URLs and canonical/OG URLs point at `localhost`/`bidspace.app` |

## Required only when the paid rail is enabled

| Variable | Req | Scope | Owner | Status | Stored in | What breaks if absent |
|---|---|---|---|---|---|---|
| `STRIPE_SECRET_KEY` | if payments | server 🔒 | Stripe | 🔒 | Doppler `prd` + Vercel | payments **honestly disabled** (`isStripeEnabled()` false); host payout + vendor pay UI show a "not enabled" state — no fake state |
| `STRIPE_WEBHOOK_SECRET` | if payments | server 🔒 | Stripe webhook | 🔒 | Doppler `prd` + Vercel | `/api/stripe/webhook` returns 503 → no settlement |

## Optional — features degrade honestly when absent

| Variable | Scope | Owner | Status | Default / degraded behavior |
|---|---|---|---|---|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | browser | Mapbox | 🔒 | `/map` renders a clean "map needs a token" panel linking to the list; every unit stays reachable. **Public token — restrict by URL to the prod host.** |
| `NEXT_PUBLIC_POSTHOG_KEY` | browser | PostHog | 🔒 | analytics no-op (client `$pageview` + all server events short-circuit). **Project key, not E&E's.** |
| `NEXT_PUBLIC_POSTHOG_HOST` | browser | PostHog | — | defaults to `https://us.i.posthog.com` |
| `ADMIN_USER_IDS` | server | founder | 🔒 | comma-separated Clerk user ids; without it, admin access falls back to Clerk `publicMetadata.bidspaceAdmin === true` only |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | server / browser | Sentry | ✅ (dev) | project `bidspace` provisioned in org `automated-empires`; DSN live-verified via `tools/verify-sentry.ts` (issue `BIDSPACE-1`). Copy into `prd` when promoting. Absent = inert. |
| `SENTRY_ORG` / `SENTRY_PROJECT` | build-time (server) | Sentry | ✅ (dev) | `automated-empires` / `bidspace` — only used for source-map upload, gated on `SENTRY_AUTH_TOKEN` |
| `SENTRY_AUTH_TOKEN` | build-time (server) | Sentry | 🔒 | optional; without it, source maps aren't uploaded but error reporting still works |

## Not used (do not set)

- `SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY` — the app talks to Postgres only
  through the service-role key from server code (D025 deny-all RLS). The anon
  key is present in `.env.local` but unreferenced; a browser Supabase client
  would require RLS policies first.

## Build vs runtime

`apps/web/lib/env.ts` returns **build-only placeholders** for the three Clerk
vars during `next build` (`NEXT_PHASE === "phase-production-build"`) so CI and
Vercel builds stay green without secrets. These values are never served — at
request time a missing var throws. This is why the repo builds green today with
no Clerk app, and why the runtime still hard-requires the real keys.

## Storage model

Doppler project **`bidspace`** is the source of truth (configs `dev` / `stg` /
`prd`). `apps/web/.env.local` mirrors `dev` for local runs. For Vercel, either
connect the Doppler → Vercel integration or copy `prd` values into the Vercel
project's Environment Variables (Production scope). `NEXT_PUBLIC_*` must be set
at **build time** on Vercel (they are inlined into the client bundle).
