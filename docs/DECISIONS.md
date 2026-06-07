# BidSpace — Locked Decisions

Canonical, deduplicated decision log. Supersedes all earlier brainstorming in the Notion journal. `LOCKED` means: build against it; do not relitigate without a new dated decision.

## Product & marketplace
- **D001 — Inventory Unit is the marketplace primitive.** Distinct from Opportunity. `LOCKED`
- **D002 — Organizations own marketplace objects; users act through organizations.** `LOCKED`
- **D003 — Events are optional.** Inventory may belong to a venue, event, opportunity, or collection. `LOCKED`
- **D004 — Architecture is broad; go-to-market is dense.** Support all temporary commercial inventory; launch one region/category at a time. `LOCKED`
- **D005 — Bidding ships in the MVP. The Application object is retired and replaced by Bid.** `LOCKED`
- **D006 — Inventory Units may be individually geolocated** (venue / zone / unit-pin / floorplan precision). `LOCKED`
- **D007 — BidSpace is a Level 3 Spatial Commerce Marketplace.** `LOCKED`
- **D008 — Highest bid does not auto-win; host selection is curated.** `LOCKED`
- **D009 — Map-first, mobile-first, card-first.** `LOCKED`
- **D010 — Organizations may hold multiple marketplace role profiles.** `LOCKED`

## Technical (locked this session)
- **D011 — TypeScript end-to-end.** Matches Explore&Earn; complexity is domain logic, not infra. `LOCKED`
- **D012 — Supabase Postgres + PostGIS is the system of record.** Replaces the Azure lean. `LOCKED`
- **D013 — Clerk for authentication** (multi-role accounts, orgs, team members). `LOCKED` · *Cross-app standard.*
- **D014 — Mapbox for the spatial layer** (custom layers/floorplans). `LOCKED` · *Cross-app standard.*
- **D015 — Stripe Connect for payments.** No charge at bid time; charge after host acceptance. `LOCKED`
- **D016 — Monorepo via pnpm + Turborepo.** `LOCKED`
- **D017 — This repository is the canonical _implementation_ spec.** Notion journal is the vision log. `LOCKED` · **Partially superseded by D022** (the blanket "repo wins on conflict" clause now applies to implementation conflicts only).

## Economics, trust & data (locked 2026-06-03)
- **D018 — Platform fee: 10% seller-side commission.** A platform commission of **10% of the accepted bid/booking amount** is charged to the **host (seller)** and deducted from payout via Stripe Connect; the host nets ~90%. Bidders pay only their bid amount at launch (no separate buyer fee). Stripe processing fees are absorbed by the platform out of its commission. Implemented as a configurable rate in basis points (`DEFAULT_PLATFORM_FEE_BPS = 1000`) so it can be tuned per category/deal without code changes. Rationale: single-sided seller commission is the marketplace standard, simplest to communicate, and avoids suppressing bids with buyer-side fees. Revisit a buyer service fee post-MVP once unit economics are known. Resolves **O1**. `LOCKED`
- **D019 — Bid visibility: sealed by default.** Bids are **sealed**: a bidder sees only their own bid (and its status), never competitors' identities or amounts. The **host sees all bids** in full to support curated selection (D008). Hosts may optionally surface a non-identifying standing signal to bidders (e.g. a rank band like "top tier"), and may optionally switch a specific opportunity to an open/transparent mode (current high bid visible) — both default **off**. Rationale: aligns with curated, multi-criteria selection; avoids a price race-to-bottom; preserves negotiation via counters. Resolves **O2**. `LOCKED`
- **D020 — Money is stored and computed in integer cents.** All monetary columns are `bigint` cents (`*_cents`) end-to-end, matching Stripe's minor-unit API and the core `money.ts` helpers; `numeric` is reserved for non-money ratings/scores. This resolved an audit-found inconsistency where some money columns were `numeric` dollars. Resolves the money-unit drift. `LOCKED`
- **D021 — Integration providers are locked; the canonical registry is `docs/INTEGRATIONS.md`.** Service providers: Vercel, Supabase, Clerk, Stripe Connect, Mapbox, Cloudinary, Sentry, PostHog, GitHub, Doppler, GoDaddy, and design tooling (Figma, Canva, Streamline). Standard tooling (npm/pnpm, Playwright, TypeScript, ESLint/Prettier, Turborepo, CLIs) is assumed and not relisted as a provider decision. `LOCKED`

## Cross-app alignment
- **D022 — Source-of-truth split & cross-app alignment (2026-06-03).** Adopts the Explore&Earn doctrine across all AutomatedEmpires apps: **Notion holds product & vision truth; this repo holds implementation truth.** On a *product/vision* conflict, Notion decides; on an *implementation* conflict, this repo decides. Partially supersedes D017's blanket "repo wins." Also confirms the cross-app runtime + integration spine (Node 24.16.0, pnpm 10.12.4, Turborepo; Clerk auth, Mapbox maps, Supabase, Stripe Connect, Doppler, Vercel, PostHog, Sentry, Cloudinary) and the shared agent operating contract in `AGENTS.md` / `docs/AGENT-ALIGNMENT-NOTES.md`. `LOCKED`

## Product, platform & operating model (mirrored from Notion, locked 2026-06-05/06)
> Mirrored from the BidSpace Notion Decision Log (product/vision truth per D022). These four decisions were previously missing from this file, which caused journal↔repo drift. Do not renumber: **D023–D026 are reserved for these**, matching the journal.
- **D023 — Icon style: Streamline Ultimate family.** All product/UI icons come from the Streamline **Ultimate** set for one coherent visual language; rendered through the shared `packages/ui` icon primitive. `LOCKED` *(provisional — the specific Streamline style may change on founder review; the "single locked Streamline family" rule does not).*
- **D024 — Mobile = mobile-first responsive web for the MVP; native (Expo / React Native) is deferred.** "Mobile-first" (D009) ships as a responsive web app in `apps/web`, not a native app. A native Expo/React Native client is explicitly **deferred** until after the web MVP proves the core loop; `apps/mobile` is not built yet. This keeps one surface to build and avoids splitting effort pre-traction. `LOCKED`
- **D025 — API transport: Next.js App Router server actions, not bespoke REST.** First-party flows use **server actions → typed data/service layer (`@bidspace/db` / `@bidspace/services`) → `revalidatePath`**, with auth + active-org resolved **server-side via Clerk** (never trusted from client input or headers). **No bespoke REST API for the app's own screens.** Route handlers are reserved for **webhooks and third-party callbacks** (e.g. Stripe) and for any explicitly public/partner API. Mirrors the Explore&Earn transport pattern. Reconciles `docs/API.md`. `LOCKED`
- **D026 — Adopt the AutomatedEmpires operating model proven in Explore&Earn.** (1) **Durable-artifact relay** — one issue = one unit of work, one agent / one branch, `ready-for-engineering` gating before a build agent picks it up; memory lives in issues/PRs/`docs/`. (2) **Build order** — foundation → design system → core card → database → feature surfaces. (3) **Forbidden-until-approved gates** — auth, schema/migrations, payments/refunds, trust/verification, permissions/RLS, launch/deploy, and destructive ops require explicit founder sign-off (builder is never the approver). `LOCKED`

> **D027–D028 reserved** for the agent-roster (Codex retirement) and GTM-candidate (HubSpot/Intercom) decisions in PR #41 — renumbered from a draft D023/D024 so they no longer collide with the journal-mirrored decisions above.

## Open (must lock before/at relevant phase)
- **O3 — Multi-unit allocation algorithm** beyond manual host selection. *V2.*
- **O4 — Verification badge pass/fail criteria** per type. *Before trust badges ship.*
- **O5 — Search infra trigger** (when to move beyond Postgres FTS / PostGIS). *Post-MVP.*
- **O6 — Legal & compliance registry** (contracts, liability, refunds by jurisdiction). *Before public launch.*
