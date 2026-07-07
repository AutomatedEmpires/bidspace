# BidSpace — State & Next Steps

## Production convergence pass (2026-07-06)

One sustained pass took the repo from an auth scaffold + services layer to a full product
surface. Branch: `integration/recovered-bidspace-product`. All slices committed separately;
typecheck, lint, and all 59 unit tests green.

### What now exists

**Design system** — `packages/ui`: Tailwind v4 CSS-first tokens (plaster canvas, structural
ink, survey-orange signal, blueprint plan blue), Fraunces + Instrument Sans, semantic Phosphor
icon registry, primitives (Button/Badge/Panel/Field/EmptyState/Skeleton/StatTile/Table/Prose),
canonical status→tone map. See D023.

**Schema** — migrations 0009 (opportunity visibility, vendor networks, saved opportunities,
opportunity invitations, Stripe webhook idempotency ledger) and 0010 (RLS deny-by-default;
service-role only — D025). `packages/db/src/types.ts` is now a complete mirror.
Demo supply: `packages/db/seed/seed.sql` (Inland Northwest).

**Services** — network visibility rule (`canSeeOpportunity`), saved, context-anchored
messaging, grounded reviews + aggregates, trust provenance signals, explainable fit engine,
admin queues, public listings with slugs (D027), publish guard, bid/booking context lists.

**Public product** — spatial homepage (animated site-plan hero, CSS-only), `/explore`
(filters + skeletons + specific empty states), `/map` (Mapbox viewport discovery over the
PostGIS RPC, honest no-token fallback), `/opportunities/[slug]` (visibility-enforced, JSON-LD),
`/units/[unitId]` sealed-bid surface, `/hosts/[slug]` + `/vendors/[slug]` profiles,
how-it-works / for-hosts / for-vendors / pricing / trust / about, four legal drafts,
sitemap + robots.

**Vendor cockpit** — `/discover` (invitations first), `/saved`, `/bids` (withdraw, accept
counter), `/bookings[/*]` (Stripe Checkout payment, operational access unlocks on confirm,
review form on completion), `/business` (profile, portfolio, documents, trust), `/messages`.

**Host cockpit** — `/host` command center (needs-action first; new-host activation path),
locations (public vs. booked-only access info), events, opportunity builder + manage
(positions, lifecycle, invitations), bid review pipeline (view/shortlist/counter/waitlist/
decline/**award chain** → booking with terms snapshot + payment record + unit reservation),
bookings lifecycle, month calendar, vendor network, payouts settings (Stripe Connect Express).

**Admin** — intervention queue home, verification (orgs + documents, recorded admin actions),
organization moderation, reports & disputes, payment exceptions.

**Money** — D018/D026: award → `pending_payment` booking → Checkout destination charge with
application fee → signature-verified idempotent webhook → `settleBookingPayment` through the
state machines. Every payment surface is env-gated; no fake payment state anywhere.

### Blockers only the founder can clear

1. **Provision the stack.** BidSpace has **no Doppler project and no Supabase project** (only
   sweepza / explore&earn exist). Needed: Supabase project (free on the current org — the MCP
   `create_project` call was permission-blocked in this session), run migrations 0001–0010 +
   optional seed; Doppler project `bidspace` with `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   Clerk keys (create the BidSpace Clerk app), `NEXT_PUBLIC_MAPBOX_TOKEN`, `STRIPE_SECRET_KEY`
   + `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_SITE_URL`, `ADMIN_USER_IDS`, PostHog key; Vercel
   project wiring.
2. **Stripe Connect**: enable Connect (Express) on the Stripe account and point the webhook at
   `/api/stripe/webhook` (`checkout.session.completed`, `checkout.session.expired`,
   `payment_intent.payment_failed`).

### Next engineering steps (in order)

1. Runtime QA pass against a provisioned stack (sign-up → onboard → venue → opportunity →
   unit → publish → bid → award → pay (test mode) → review) and fix what it surfaces.
2. Playwright E2E for that loop + private-network visibility (needs live Clerk/Supabase).
3. Cloudinary upload widget for venue/opportunity/portfolio images (URL entry ships today).
4. Sentry wiring (`@sentry/nextjs`) + PostHog server-side capture of marketplace events
   (bid_submitted, bid_awarded, booking_paid) — client pageviews ship today.
5. Generated Supabase types replacing the hand-authored mirror (`gen:types`).
6. Recurring releases: copy-forward an opportunity + its units to new dates (template flow).
7. Review-prompt loop after `completed` bookings; host→vendor review form (vendor→host ships).
8. RLS policies if a browser-side Supabase client is ever introduced (D025).

### Historical (2026-06-04 foundation notes)

Superseded by this pass; see git history for the original checklist.
