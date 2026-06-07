# Architecture

## Stack & rationale
| Layer | Choice | Why |
|---|---|---|
| Language | TypeScript | One language across web, (later) mobile, services; matches Explore&Earn tooling and agents. |
| Web / Admin | Next.js (App Router) | SEO public pages + dashboards + admin in one framework. |
| Mobile | **Responsive web (MVP)**; Expo / React Native **deferred (D024)** | Mobile-first (D009) ships as a responsive web app first; a native client is deferred until the web MVP proves the core loop. |
| Transport | Next.js **server actions** (D025) | First-party flows use server actions → service layer → `revalidatePath`; no bespoke REST for app screens. Route handlers reserved for webhooks / public API. |
| Database | Supabase Postgres + PostGIS | Relational marketplace data + first-class geospatial; storage + realtime included. |
| Auth | Clerk | Multi-role, org-aware accounts, team members. |
| Payments | Stripe Connect | Platform/host/bidder flows, payouts, refunds. |
| Maps | Mapbox | Custom layers, zones, floorplans for unit-level spatial commerce. |
| Monorepo | pnpm + Turborepo | Matches Explore&Earn; shared packages, cached builds. |

### Why not Azure / .NET
The journal leaned Azure for AI and a possible .NET backend. BidSpace's complexity is **domain logic** (bidding, geospatial inventory, marketplace payments, trust scoring), not infrastructure. Supabase delivers Postgres + PostGIS + storage + realtime with far less setup; AI is served by the OpenAI API. Matching the Explore&Earn stack also inherits the existing Notion↔GitHub sync pipeline and lane model. Azure remains a later deployment option; it is not required to build.

## Monorepo layout
- `apps/web` — Next.js: public site, host/bidder/admin dashboards. **The single MVP surface (D024)**; first-party transport is server actions (D025).
- `apps/mobile` — Expo native client. **Deferred (D024)**; not built yet.
- `apps/api` — only if/when a public/partner REST surface is needed (D025). First-party screens do **not** use it.
- `packages/db` — SQL migrations (source of truth) + generated types
- `packages/ui` — shared component library / design tokens (Streamline Ultimate icons, D023)
- `packages/core` — shared domain logic (bid lifecycle, scoring, money)
- `docs` — canonical specification

## Object-first build order
Build objects, not pages: User → Organization → Role Profile → Venue → Event → Opportunity → Inventory Unit → Bid → Booking → Payment → Review → Performance Data.

## Environments
- `local` (Supabase CLI), `staging`, `production`.
- Secrets via env (`.env.example` committed; real values never committed).
