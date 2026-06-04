# BidSpace

**A map-first bidding marketplace for temporary commercial inventory.**

BidSpace is a Level 3 *spatial commerce marketplace*: hosts turn physical space and audience traffic into geolocated, biddable **Inventory Units**, and bidders compete for access. The platform runs discovery, structured bidding, curated host selection, payments/booking, verification, and a compounding performance-data moat.

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
