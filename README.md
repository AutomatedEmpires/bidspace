# BidSpace

**A map-first marketplace for temporary commercial inventory.**

Hosts list space, bidders submit sealed competitive bids, hosts make curated selections (highest bid does not auto-win), and verification keeps the market trustworthy.

## Core model
- **Inventory Unit** is the marketplace primitive (separate from Opportunity).
- **Organizations** own marketplace objects; **users** act through organizations.
- **Events are optional** — inventory can exist on a venue without an event.

## Stack
| Layer | Choice |
|---|---|
| Language | TypeScript (end-to-end) |
| Web / Admin | Next.js |
| Mobile | Expo / React Native |
| Database | Supabase Postgres + PostGIS |
| Auth | Clerk |
| Payments | Stripe Connect |
| Maps | Mapbox |
| Monorepo | pnpm + Turborepo |

## Runtime
- Node **24.16.0** (`.nvmrc`) · pnpm **10.12.4** · Turborepo
- Cross-app standard shared with Explore&Earn and Sweepza. See `AGENTS.md`.

## Local setup

### 1. Install the pinned runtime and dependencies

```bash
nvm use
pnpm install --frozen-lockfile
```

### 2. Choose an env injection path

Recommended path: use Doppler so the same variable names feed local dev, CI, and hosted environments.

```bash
doppler run -- pnpm --filter @bidspace/web dev
```

Manual path: create `apps/web/.env.local` and populate the web runtime variables from `.env.example` without committing secret values.

Required for the current web runtime:

```dotenv
CLERK_PUBLISHABLE_KEY=
# Optional alias; the app also accepts this if you use Clerk's standard public naming.
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

### 3. Start the web app

```bash
pnpm --filter @bidspace/web dev
```

### 4. Optional local database tooling

Use the local Supabase stack and export `DATABASE_URL` before running database commands from the repo root.

```bash
supabase start
export DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

If `pnpm` warns that the `supabase` binary was not linked because build scripts were blocked, run `pnpm approve-builds` and allow `supabase` before using `pnpm --filter @bidspace/db gen:types`.

## Environment requirements by task

| Task | Required env | Notes |
|---|---|---|
| `pnpm install` | none | Fully reproducible from the lockfile. |
| `pnpm lint` | none | Current lint scope is the web app. |
| `pnpm typecheck` | none | Typecheck is env-free today. |
| `pnpm test` | none | Root `pnpm test` runs the real `@bidspace/core`, `@bidspace/services`, and `@bidspace/web` suites via Turbo. |
| `pnpm build` | none today | `apps/web/lib/env.ts` returns build-only Clerk placeholders during `next build`, so CI can verify builds without live secrets. This does not make runtime safe. |
| Web dev server process boot | none to start the process | `next dev` can start, but the first request still needs real Clerk runtime env. |
| First page request (`/`, `/sign-in`, `/sign-up`) | `CLERK_PUBLISHABLE_KEY` or `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, plus `CLERK_SECRET_KEY` | `apps/web/app/layout.tsx` and `apps/web/middleware.ts` read Clerk env at runtime. Missing values produce a deliberate developer-facing error. |
| Authenticated/product routes (`/onboarding`, `/dashboard`) | Clerk vars above, plus `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` | These routes also require server-side Supabase access through `apps/web/lib/bidspace-server.ts`. |
| Auth flows | `CLERK_PUBLISHABLE_KEY` or `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, plus `CLERK_SECRET_KEY` | Required for Clerk UI, middleware protection, and session resolution. |
| Supabase / DB tooling | `DATABASE_URL` | Needed for `psql`/migration commands; `pnpm --filter @bidspace/db gen:types` also needs a working `supabase` CLI. |

## Local failure mode

BidSpace remains strict at runtime: missing Clerk or Supabase configuration should fail fast instead of pretending auth works. The current hardening keeps that behavior, but the thrown error is now explicit about how to fix local setup. Production validation is unchanged.

## Repo layout
- `apps/` — web (Next.js), mobile (Expo), api (added in later PRs)
- `packages/db/` — SQL migrations (Postgres + PostGIS), source of truth for schema
- `packages/ui/`, `packages/core/` — shared UI and domain logic (later PRs)
- `docs/` — canonical, deduped specification

## Documentation (canonical spec)
- [AGENTS.md](AGENTS.md) — binding agent operating contract
- [docs/DECISIONS.md](docs/DECISIONS.md) — locked decisions
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — stack & rationale
- [docs/DATA-MODEL.md](docs/DATA-MODEL.md) — objects & enums
- [docs/ROADMAP.md](docs/ROADMAP.md) — MVP → v4 build sequence
- [docs/API.md](docs/API.md) — REST resource map
- [docs/GTM.md](docs/GTM.md) — liquidity & launch strategy
- [docs/AGENT-ALIGNMENT-NOTES.md](docs/AGENT-ALIGNMENT-NOTES.md) — cross-app alignment handoff

> **Source of truth (see DECISIONS D022):** Notion holds product & vision truth; this repository holds implementation truth. On a *product/vision* conflict, Notion decides; on an *implementation* conflict, this repo decides. This supersedes the earlier "repo wins on everything" stance (D017).
