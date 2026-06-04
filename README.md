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

## Repo layout
- `apps/` — web (Next.js), mobile (Expo), api (added in later PRs)
- `packages/db/` — SQL migrations (Postgres + PostGIS), source of truth for schema
- `packages/ui/`, `packages/core/` — shared UI and domain logic (later PRs)
- `docs/` — canonical, deduped specification

## Documentation (canonical spec)
- [docs/DECISIONS.md](docs/DECISIONS.md) — locked decisions
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — stack & rationale
- [docs/DATA-MODEL.md](docs/DATA-MODEL.md) — objects & enums
- [docs/ROADMAP.md](docs/ROADMAP.md) — MVP → v4 build sequence
- [docs/API.md](docs/API.md) — REST resource map
- [docs/GTM.md](docs/GTM.md) — liquidity & launch strategy

> This repository is the source of truth. The Notion "BidSpace" journal is the founder vision log; where they differ, this repo wins.
