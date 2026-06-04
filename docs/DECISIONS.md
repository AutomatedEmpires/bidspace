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
- **D013 — Clerk for authentication** (multi-role accounts, orgs, team members). `LOCKED`
- **D014 — Mapbox for the spatial layer** (custom layers/floorplans). `LOCKED`
- **D015 — Stripe Connect for payments.** No charge at bid time; charge after host acceptance. `LOCKED`
- **D016 — Monorepo via pnpm + Turborepo.** `LOCKED`
- **D017 — This repository is the canonical spec.** Notion journal is the vision log; repo wins on conflict. `LOCKED`

## Economics, trust & data (locked 2026-06-03)
- **D018 — Platform fee: 10% seller-side commission.** A platform commission of **10% of the accepted bid/booking amount** is charged to the **host (seller)** and deducted from payout via Stripe Connect; the host nets ~90%. Bidders pay only their bid amount at launch (no separate buyer fee). Stripe processing fees are absorbed by the platform out of its commission. Implemented as a configurable rate in basis points (`DEFAULT_PLATFORM_FEE_BPS = 1000`) so it can be tuned per category/deal without code changes. Rationale: single-sided seller commission is the marketplace standard, simplest to communicate, and avoids suppressing bids with buyer-side fees. Revisit a buyer service fee post-MVP once unit economics are known. Resolves **O1**. `LOCKED`
- **D019 — Bid visibility: sealed by default.** Bids are **sealed**: a bidder sees only their own bid (and its status), never competitors' identities or amounts. The **host sees all bids** in full to support curated selection (D008). Hosts may optionally surface a non-identifying standing signal to bidders (e.g. a rank band like “top tier”), and may optionally switch a specific opportunity to an open/transparent mode (current high bid visible) — both default **off**. Rationale: aligns with curated, multi-criteria selection; avoids a price race-to-bottom; preserves negotiation via counters. Resolves **O2**. `LOCKED`
- **D020 — Money is stored and computed in integer cents.** All monetary columns are `bigint` cents (`*_cents`) end-to-end, matching Stripe's minor-unit API and the core `money.ts` helpers; `numeric` is reserved for non-money ratings/scores. This resolved an audit-found inconsistency where some money columns were `numeric` dollars. Resolves the money-unit drift. `LOCKED`
- **D021 — Integration providers are locked; the canonical registry is `docs/INTEGRATIONS.md`.** Service providers: Vercel, Supabase, Clerk, Stripe Connect, Mapbox, Cloudinary, Sentry, PostHog, GitHub, Doppler, GoDaddy, and design tooling (Figma, Canva, Streamline). Standard tooling (npm/pnpm, Playwright, TypeScript, ESLint/Prettier, Turborepo, CLIs) is assumed and not relisted as a provider decision. `LOCKED`

## Open (must lock before/at relevant phase)
- **O3 — Multi-unit allocation algorithm** beyond manual host selection. *V2.*
- **O4 — Verification badge pass/fail criteria** per type. *Before trust badges ship.*
- **O5 — Search infra trigger** (when to move beyond Postgres FTS / PostGIS). *Post-MVP.*
- **O6 — Legal & compliance registry** (contracts, liability, refunds by jurisdiction). *Before public launch.*
