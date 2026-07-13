# BidSpace — Venture Operating Contract

This contract binds human and automated contributors. Read it before changing the repository. **Notion decides. GitHub builds. Figma shows. Everything else runs.** Approved Notion decisions hold product/vision truth; this repository holds implementation truth. Reconcile conflicts in a dated durable artifact.

## 1. Venture thesis, user, and destination

**Thesis:** valuable temporary commercial capacity—vendor booths, food-truck pads, market stalls, kiosks, placements, and other time-bound rights to physical space—is still allocated through PDFs, inboxes, spreadsheets, and private relationships. BidSpace can make that capacity structured, visible, spatially discoverable, fairly allocatable, and repeatable.

The primary operating customer and buyer is the host, venue operator, market organizer, or space owner who controls inventory and needs to publish and allocate it. The primary demand user is the vendor/business seeking a place to operate. Hosts own and publish supply; vendors are not inventory sources.

The product destination is a map-first, mobile-first operating marketplace for temporary commercial space and vendor placement: hosts define durable venues, zones, and **Inventory Units**, release them as opportunities, choose among qualified vendors, and manage the resulting operating record. Vendors discover space through map/list parity, understand fit and terms, submit a sealed offer/bid, and build a reusable reputation. **Bid is the canonical allocation object; the retired Application object must not be recreated.**

## 2. Evidence-based product direction

The dominant repository direction is **map-first temporary commercial space and vendor placement**, not a general auction-listing marketplace:

- the README and public home page call BidSpace a map-first marketplace for temporary commercial inventory/space;
- `/explore`, `/map`, `/for-hosts`, `/for-vendors`, venue/zone/opportunity/unit routes, and the host/vendor cockpits organize the product around real places and controlled supply;
- PostGIS venue, zone, opportunity, and unit schemas support venue points, polygons, unit pins, floorplan coordinates, dates, requirements, and access; and
- locked decisions D004, D006, D008, and D009 establish broad temporary inventory, geolocation, curated host choice, and map-first UX.

Bidding is an **auction-like allocation mechanism**, not the venture identity. Bids are sealed by default, the highest amount does not automatically win, and fixed, minimum-bid, competitive, and hybrid pricing modes coexist. Do not copy open-auction dynamics or describe BidSpace as an auction aggregator.

One ambiguity remains: the schema also permits sponsor assets, service slots, advertising placements, and temporary real estate across multiple commerce layers. Public copy sometimes broadens from vendor space into spatial commerce. Until a dated product decision proves a different wedge, treat those as expansion taxonomy and keep the near-term product centered on host-controlled temporary commercial space and vendor placement.

## 3. Current stage and zero-user posture

BidSpace is pre-customer and pre-public-launch. The portfolio currently has **zero real users and zero real customers**. Seed data, provider projects, development identities, internal marketplace-loop proof, green CI, or a deployment preview do not prove a live marketplace, supply liquidity, bookings, payments, or revenue.

Do not preserve weak flows for nonexistent customers. Agents may change copy, UX, schema, and architecture when evidence supports a better vendor/host outcome, using synthetic organizations, opportunities, bids, bookings, and protected previews. Continue to protect credentials, provider state, rights-controlled inventory, personal/business data, and payment/legal boundaries.

## 4. Execution doctrine and authority

Agents are expected to ship meaningful, tested improvements, not produce endless audits or activation checklists. Inspect enough to choose a coherent slice, implement it through the real host/vendor path, and leave reviewable evidence on a reversible branch. Prefer one working host-create → vendor-discover step over many empty dashboard cards.

Without additional founder approval, an agent may perform reversible, non-destructive work inside an assigned lane, including:

- product code, tests, UI, copy, documentation, refactors, accessibility, performance, observability, security, dependency, and CI work;
- local branches, small PRs, protected previews, and preview-only configuration;
- local, isolated, or development migrations; deterministic fixtures and disposable preview/test organizations, venues, units, bids, bookings, and payments;
- Stripe Connect architecture, onboarding, checkout, webhook, refund, dispute, and payout-state testing in test/sandbox mode only, with no real charge or transfer;
- internal email tests to controlled team-owned recipients, clearly identified as tests;
- development auth and provider integration work using least-privilege non-production credentials; and
- lawful, source-cited vendor prospect research and pipeline building.

An existing document is evidence, not automatic authority. Reconcile stale claims against current code, routes, schema, Git history, and approved decisions. Never label simulated, seeded, skipped, preview-only, or test-mode behavior as a live marketplace result.

## 5. True hard stops

Stop and obtain the required accountable human action only for:

- a paid plan upgrade;
- a domain purchase or DNS cutover;
- live money, a real charge, refund, payout, transfer, or Stripe live-mode action;
- destructive deletion of a provider project/resource;
- a destructive production database migration or production-data purge;
- credential rotation or revocation;
- account, organization, repository, or asset ownership transfer;
- a public launch announcement;
- buying or placing ads, starting or activating any public campaign, or sending a marketing broadcast;
- a legal or regulatory filing; or
- an action that requires MFA when the accountable person is unavailable.

Do not broaden this list into generic founder gating. Normal implementation, protected previews, sandbox payments, internal tests, reversible provider/dev configuration, and additive local/dev migrations proceed through the repository workflow. If a live-provider or additive production-data operation is explicitly assigned and does not hit a hard stop, it still requires exact scope, least privilege, backup/rollback evidence, independent review, and a recorded result; a feature request does not silently authorize live mutation.

## 6. Priorities

Work in roughly this order unless a current issue or incident supplies better evidence:

1. Prove host onboarding and host/seller inventory creation: venue → zone/event when useful → opportunity → Inventory Unit → controlled publish. Hosts must own or control publication rights.
2. Make vendor onboarding and profiles credible enough to support fit, documents, portfolio, category, footprint, utilities, travel range, and repeat relationships.
3. Deliver map/list discovery and site-plan UX with parity across venue, zone, unit-pin, and floorplan precision; preserve accessible card and mobile behavior when a map is unavailable.
4. Complete safe marketplace demos: discover → qualify → sealed offer/bid → host shortlist/counter/award → test-mode payment/booking record. Every demo must be conspicuously synthetic or test-mode.
5. Build a lawful, source-cited vendor prospect pipeline. Prospects are demand leads, not users, inventory, partnerships, bookings, or proof of liquidity.
6. Improve host private-network, invitation, and repeat-vendor flows so existing relationships can onboard before public-market supply.
7. Maintain Stripe Connect test-mode architecture and write decision-ready legal/entity/operator/tax/KYC/payout/refund/dispute/reserve/support documents. Live Connect remains blocked until those decisions are approved.
8. Resolve security, RLS, authorization, dependency, CI, rollback, observability, and accessibility defects that block the core path.

## 7. Low-value and prohibited work

- Do not scrape, repost, or import auction listings as inventory. Do not turn public business listings into host-owned supply.
- Do not make vendors publish spaces they do not control. Hosts/venue owners create and publish inventory with rights provenance; vendor prospecting supplies the demand pipeline.
- Do not build open-auction spectacle, auto-award to the highest bid, bid-chasing dark patterns, or a generic auction-site visual language.
- Do not imply a live marketplace, active users, verified liquidity, bidding, booking, payment, payout, or completed transaction unless current external evidence proves it.
- Do not activate Stripe Connect live mode or real marketplace money before the legal entity, platform/operator role, tax, KYC, payout, refund, dispute, reserve, and support models are approved in a dated decision.
- Do not substitute another audit, abstract architecture rewrite, dashboard shell, speculative AI score, or expansion category for a working host/vendor slice.
- Do not optimize for hypothetical scale, add alternate providers/design systems, or let incidental UI work decide unresolved allocation/legal policy.

## 8. Provider, data, rights, money, email, and auth boundaries

### Providers and deployment

The intended spine is Doppler, Vercel, Supabase Postgres/PostGIS, Clerk, Stripe Connect, Mapbox, Cloudinary, PostHog, Sentry, and Resend/email. Locked decision D029 requires **venture-dedicated accounts/resources for every external provider**. Never reuse another venture's credentials, account, capacity, telemetry, sender reputation, fixtures, or customer objects. Within BidSpace, avoid parallel replacements for the same capability unless a dated migration decision explains ownership and removal.

Never print, commit, paste into PRs, or expose secrets/private provider URLs. Keep service-role and Stripe secrets server-only. Protected previews must use isolated data and non-production provider modes. A provider label, internal test, seeded state, or preview is proof only of the tested behavior—not public readiness.

### Data, authorization, and inventory rights

- `packages/db/migrations` is schema truth; Supabase Postgres/PostGIS is the intended system of record.
- Preserve organization ownership, server-derived identity/context, service-layer authorization, and deny-by-default RLS. Never accept client role, organization, ownership, payment, or award claims as authority.
- Use synthetic fixtures by default. Access production data only for an explicitly scoped least-privilege task; redact personal, commercial, document, location, and payment details from logs/artifacts.
- Public discovery may show approved listing detail. Private invitations, access instructions, documents, contacts, and operating detail unlock only to authorized participants at the appropriate lifecycle stage.
- Inventory requires host/venue-owner control, provenance, and publication intent. A scraped listing, vendor lead, map result, or public property record is not publishable inventory.

### Money and legal

Integer-cents money, sealed bids, curated selection, payment-before-confirmed-booking, and destination-charge architecture are current implementation decisions. They are safe to exercise only in Stripe test mode until the legal/entity and payout model is approved. Test-mode success does not authorize live Connect, a real charge, a payout, a refund, or claims that BidSpace handles production payments.

Legal/entity/operator/tax/payment research, branch drafts, and tests are allowed. Legal filings and live money are hard stops. Public legal/compliance claims require authoritative evidence and applicable review; that evidence requirement does not block private drafting or preview validation.

### Email and auth

Internal Resend tests to controlled recipients are allowed in non-production. Public campaigns, imported recipient lists, sender/domain activation, and DNS changes are not ordinary tests. Clerk proves identity; application organization membership and server-side authorization grant access. Development auth must remain separate from real production.

## 9. Architecture and design

The Inventory Unit remains the canonical marketplace primitive. Organizations own marketplace objects; users act through organizations; events are optional. Keep domain logic in `packages/core`, schema/client work in `packages/db`, business operations in `packages/services`, shared components and semantic Phosphor icons in `packages/ui`, and route/presentation work in `apps/web`.

Preserve map-first, mobile-first, card-first behavior with explainable fit and map/list parity. D023 is the design authority: Fraunces and Instrument Sans, plaster/structural ink, survey orange for commitment, blueprint blue for spatial/live context, flat drafting geometry, and the semantic Phosphor registry. Do not introduce a competing icon or component system.

Use product language such as temporary commercial space, vendor placement, host-controlled inventory, opportunity, fit, sealed offer/bid, curated selection, and test-mode booking. Avoid unsupported “live,” “open now,” “pay securely,” “payout,” or marketplace-protection claims in environments where those capabilities are not externally proven.

## 10. Branch, ownership, and PR rules

- Begin by recording `git status -sb`, branch, HEAD, base, open PRs, issue/acceptance criteria, and owned files. Confirm that no other agent owns the same artifact.
- Never push directly to `main`. Use `agent/<scope>-<short-description>`, `feat/<lane>/<slug>`, `fix/<lane>/<slug>`, `docs/<lane>/<slug>`, or `chore/<lane>/<slug>`, all kebab-case.
- One coherent slice, one owner, one branch, and one artifact set. Preserve unrelated user work and do not overwrite another lane.
- Keep PRs small. Do not force-push, rewrite shared history, delete an unmerged branch, bypass required checks, or self-merge. A designated maintainer or approved automation merges after independent review.
- Cite the governing decision/spec and state acceptance criteria. A docs PR must remain docs-only.

## 11. Verification and definition of done

Use Node `24.16.0` and pnpm `10.12.4`. Root `package.json` defines:

```text
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
git diff --check
```

Root `pnpm test` runs the Turbo package suites. Add focused tests for non-trivial behavior. Use `pnpm --filter @bidspace/web e2e` only with a protected, credentialed non-production target and Stripe test mode; report self-skips as skipped, not passing end-to-end proof. Database work also needs local/isolated migration and authorization proof. Docs-only work requires `git diff --check` plus focused Markdown/link and factual review; report application checks as not run because no executable code changed.

A change is done only when it:

- improves an explicit host or vendor outcome through a meaningful end-to-end slice;
- has focused regression coverage and proportionate repository checks pass;
- preserves organization authorization, RLS, inventory rights, data, and provider boundaries;
- includes screenshots plus keyboard/mobile/accessibility evidence for UI work;
- documents new contracts, environment variables, migrations, legal assumptions, and rollback behavior;
- labels synthetic, preview, and test-mode behavior honestly and makes no unsupported marketplace/payment claim; and
- leaves a small reviewable PR with exact commands, impacts, risks, and remaining blockers.

## 12. Current PRs and blockers

Refreshed 2026-07-13 UTC: draft PR **#65**, `docs: add agent operating standards`, is the only open PR and owns `AGENTS.md` on `agent/docs-operating-standards`. It was mergeable with green checks before this contract revision; refresh after any push.

Current blockers are zero real users/customers, unproven host supply and vendor demand, no validated marketplace liquidity, the final domain/public-launch decision, and external proof of the complete host/vendor journey. Stripe Connect live use remains blocked on the dedicated legal entity/account and approved operator, tax, KYC, payout, refund, dispute, reserve, and support model. D029 also requires a dedicated BidSpace Stripe account plus migration away from currently shared Sentry and Mapbox resources and proof of a dedicated PostHog path. Assigned agents may prepare code/runbooks and create free non-production dedicated resources when ownership and rollback are clear. Reversible provider activation may proceed in an assigned lane; stop when it crosses a §5 hard stop such as a paid plan, live-money activation/real charge, ownership transfer, or unavailable MFA. Provider/dev artifacts and internal database loops do not clear those blockers. Refresh GitHub, dated decisions, and provider-safe evidence before relying on this list.

## 13. Future-agent output format

Every handoff or final report must include:

1. branch, HEAD, base, issue/acceptance criteria, and governing decision/spec;
2. outcome achieved for which host/vendor user, not merely activities performed;
3. exact files changed and concise scope;
4. commands run with pass/fail/skipped results and reasons;
5. test data and environment used, with preview/sandbox/synthetic labeling;
6. data, money, email, auth, provider, deployment, DNS, legal, inventory-rights, and security impact—`none` where applicable;
7. screenshots and accessibility notes for UI work;
8. assumptions, remaining ambiguity/risks/blockers, approvals or hard-stop actions required, and rollback implications; and
9. PR URL and state, or a clear statement that no PR was created.
