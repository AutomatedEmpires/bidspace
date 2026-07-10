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

## Open (must lock before/at relevant phase)
- **O3 — Multi-unit allocation algorithm** beyond manual host selection. *V2.*
- **O4 — Verification badge pass/fail criteria** per type. *Before trust badges ship.*
- **O5 — Search infra trigger** (when to move beyond Postgres FTS / PostGIS). *Post-MVP.*
- **O6 — Legal & compliance registry** (contracts, liability, refunds by jurisdiction). *Before public launch.*

## Production convergence pass (2026-07-06)
- **D023 — Design system: Tailwind CSS v4 + packages/ui + Fraunces/Instrument Sans + Phosphor semantic icon registry.** BidSpace visual identity is premium spatial commerce: plaster canvas, structural ink, survey-orange signal (reserved for commitment actions), blueprint plan blue for spatial/live contexts. Icons via @phosphor-icons/react behind a semantic registry (packages/ui/src/icon.tsx) — call sites never import glyphs directly. Partially supersedes the Streamline entry in D021 for the web app; Streamline remains available for design collateral. LOCKED
- **D024 — Opportunity visibility + private vendor network (0009_network.sql).** Opportunities carry visibility public | network | invite_only; vendor_network_members records standing host-vendor relationships; opportunity_invitations records direct offers; saved_opportunities is the vendor shortlist. Private and public flows share the same canonical objects — one rule (canSeeOpportunity) decides visibility everywhere. LOCKED
- **D025 — RLS posture: deny-by-default (0010_rls.sql).** All tables have RLS enabled with no policies. The web app reaches Postgres only through the service-role key from server code; authorization is enforced in the service/action layer against Clerk-derived org context. Any future browser-side Supabase client requires explicit policies first. LOCKED
- **D026 — Payment settlement path: Stripe Checkout + idempotent webhook.** Award chain: accept -> payment_pending -> booking (terms snapshot) -> payment record. Vendor pays via Stripe Checkout (destination charge, application fee per D018); the webhook is signature-verified and idempotent via the stripe_webhook_events PK ledger, settling booking/bid/unit through the canonical state machines. No fake payment state: every payment surface is env-gated on STRIPE_SECRET_KEY. LOCKED
- **D027 — Public URL scheme: slugWithRef.** Public opportunities get a slug (title + first 8 uuid chars) stamped at publish; detail routes accept slug or raw uuid. LOCKED

## Production activation pass (2026-07-07)
- **D028 — Stripe Connect: destination charges on controller-property accounts (Express-equivalent), NOT the legacy `type: "express"` account type.** Reviewed against current Stripe docs (2026-07). Findings: (1) the destination-charge model — PaymentIntent/Checkout with `application_fee_amount` + `transfer_data.destination` — is the current, recommended pattern for a marketplace like BidSpace and needs no change; (2) legacy Standard/Express/Custom account *types* are now deprecated in favour of **controller properties** (Accounts v1) or **Accounts v2**. Decision: create connected accounts with controller properties matching Express behaviour (`stripe_dashboard.type: express`, `fees.payer: application`, `losses.payments: application`, default Stripe requirement collection) and request the `transfers` capability. Accounts v2 was rejected for launch: it needs dashboard early-access enablement, beta headers, Sandbox-only testing, and `on_behalf_of`/merchant+recipient config — disproportionate disruption for no launch benefit (mandate: 'least necessary disruption'). Implemented in `apps/web/lib/stripe.ts`; Checkout, webhook settlement, and the 10% split (D018) are unchanged. Activation runbook: `docs/CONNECT-RUNBOOK.md`. `LOCKED`

## Entity separation + accounts (2026-07-10)
- **D029 — BidSpace is a separate entity with its own dedicated accounts for every external service; it gets a DEDICATED Stripe account.** Founder directive (2026-07-10): each AutomatedEmpires venture is a separate entity and must have its own dedicated accounts for everything (Stripe, Clerk, Mapbox, PostHog, Sentry, etc.) — not shared org accounts. Concretely: BidSpace's money flows through a NEW dedicated Stripe account (NOT the shared KYC-complete acct_1SpxXpDtcwz0cxzo used by Sweepza/LogLoads, and NOT acct_1RMjIWIH4Hw2pSG9 'explore&earn' that the claude.ai Stripe connector is bound to). Already-dedicated: Supabase project bidspace (hnjjcgxflxlfsqslgxcv), Doppler project bidspace, Clerk app (factual-puma-97 dev instance). To migrate to dedicated per this rule: the Sentry project currently lives in the shared automated-empires org, and the Mapbox token is from the shared automatedempires account — both to be re-provisioned as dedicated BidSpace accounts (see docs/CODEX-HANDOFF.md §5). LOCKED
