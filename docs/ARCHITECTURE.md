# Architecture

## Stack & rationale
| Layer | Choice | Why |
|---|---|---|
| Language | TypeScript | One language across web, mobile, api; matches Explore&Earn tooling and agents. |
| Web / Admin | Next.js | SEO public pages + dashboards + admin in one framework. |
| Mobile | Expo / React Native | Map-first bidder experience; shared TS with web. |
| Database | Supabase Postgres + PostGIS | Relational marketplace data + first-class geospatial; storage + realtime included. |
| Auth | Clerk | Multi-role, org-aware accounts, team members. |
| Payments | Stripe Connect | Platform/host/bidder flows, payouts, refunds. |
| Maps | Mapbox | Custom layers, zones, floorplans for unit-level spatial commerce. |
| Monorepo | pnpm + Turborepo | Matches Explore&Earn; shared packages, cached builds. |

### Why not Azure / .NET
The journal leaned Azure for AI and a possible .NET backend. BidSpace's complexity is **domain logic** (bidding, geospatial inventory, marketplace payments, trust scoring), not infrastructure. Supabase delivers Postgres + PostGIS + storage + realtime with far less setup; AI is served by the OpenAI API. Matching the Explore&Earn stack also inherits the existing Notion↔GitHub sync pipeline and lane model. Azure remains a later deployment option; it is not required to build.

## Monorepo layout
- `apps/web` — Next.js: public site, host/bidder/admin dashboards
- `apps/mobile` — Expo: bidder discovery, bidding, host quick-manage
- `apps/api` — TypeScript service layer (or Next.js route handlers initially)
- `packages/db` — SQL migrations (source of truth) + generated types
- `packages/ui` — shared component library / design tokens
- `packages/core` — shared domain logic (bid lifecycle, scoring, money)
- `docs` — canonical specification

## Object-first build order
Build objects, not pages: User → Organization → Role Profile → Venue → Event → Opportunity → Inventory Unit → Bid → Booking → Payment → Review → Performance Data.

## Environments
- `local` (Supabase CLI), `staging`, `production`.
- Secrets via env (`.env.example` committed; real values never committed).
