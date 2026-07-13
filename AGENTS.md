# BidSpace — Agent Operating Contract

This contract binds human and automated contributors. Read it before inspecting or changing the repository. **Notion decides and builds. GitHub reviews and ships. Figma shows. Everything else runs.** Approved Notion material is product and vision truth; this repository is implementation truth. Record and reconcile conflicts through durable artifacts.

## 1. App purpose

BidSpace is an auction/vendor marketplace for spatial advertising and other physical inventory. Hosts turn physical space and audience traffic into geolocated, biddable **Inventory Units**; bidders compete, but host selection remains curated and the highest bid does not automatically win.

The Inventory Unit is the canonical product concept. Preserve the map-first, mobile-first, card-first interface and clear separation between discovery, bidding, host choice, and eventual fulfillment.

## 2. Business vision

Build a trustworthy spatial-commerce marketplace in which hosts and venue owners publish rights-controlled Inventory Units and vendors are demand-side bidders comparing location, audience, constraints, and commercial terms without obscuring host discretion.

Do not scrape auction listings into marketplace inventory. Build a vendor-prospect pipeline from lawful public business-contact research instead. Vendor prospects are bidder-side leads and never inventory. Inventory publication requires host/venue-owner onboarding, verified rights, provenance, and the relevant approvals.

Money movement is not the first milestone. The Inventory Unit, product intent, permissions, curated selection model, and operational/legal ownership must be sound before marketplace payments can activate.

## 3. Current rollout status

Snapshot: **2026-07-12**. Status: **blocked · security-risk · design-needed**. There are **no open PRs** at this snapshot. Refresh current branch, HEAD, PR, issue, acceptance-criteria, artifact ownership, and rollout data before acting; do not rely on stale status.

Known blockers are dependency strategy, final domain, RLS and product intent, production auth and mail, external end-to-end evidence, and the Stripe Connect legal and operating model.

## 4. Branch naming rules

Before work, record `git status -sb`, the current branch and HEAD, open PRs, the issue and acceptance criteria, and artifact ownership. One agent owns one task, one branch, and one artifact set at a time. Issues, PRs, decisions, and repo documentation are the durable handoff; private chat memory is not.

- Agent work: `agent/<scope>-<short-description>`
- Normal feature work: `feat/<lane>/<slug>`
- Fixes: `fix/<lane>/<slug>`
- Documentation: `docs/<lane>/<slug>`
- Chores: `chore/<lane>/<slug>`

Use kebab case. Implementing agents/builders never direct-push `main`, merge their own PRs, delete unmerged branches, rewrite history, force-push, or overwrite another agent’s lane or artifact. A designated maintainer or approved automation may merge after independent review and green required checks, then delete the merged branch. Keep PRs small, cite the governing decision/spec, and tie work to an issue and acceptance criteria. The builder is not the sole approver.

## 5. Required checks before PR

Run from the repository root and report the exact command and result:

```text
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
git diff --check
```

Add focused tests for non-trivial behavior and external end-to-end coverage when the acceptance criteria require it. Include screenshots and accessibility evidence for UI work. If a check cannot run, report why; do not describe an unrun check as passing.

## 6. Forbidden actions

- Do not scrape or repost auction listings or promote vendor prospects to live inventory without onboarding and verified rights.
- Do not implement or activate Stripe Connect money movement before legal entity, operator role, tax, KYC, payout, refund, dispute, reserves, and support decisions are approved.
- Do not bypass the Inventory Unit model, curated host selection, RLS, monorepo boundaries, or documented source-of-truth decisions.
- Do not delete live data, drop schemas, weaken permissions, bypass review, introduce unapproved provider or runtime alternatives, or make unrelated drive-by changes.
- Do not deploy, alter domains/DNS, expose secrets, or perform any unscoped live or production mutation.

## 7. Provider no-touch zones

Doppler, Vercel, Supabase, Clerk, Stripe, Resend and DNS, Mapbox, Cloudinary, PostHog, Sentry, and all provider-specific resources are no-touch unless the task explicitly approves the exact action. No deploy, environment, domain, DNS, secret, live migration or SQL, auth, storage, product, price, webhook, email, or telemetry writes are authorized by ordinary repository work.

Stripe Connect may be named as intended architecture only when it is clearly labeled **blocked/not authorized**. Documentation of intent is not permission to create or mutate accounts, products, prices, connected accounts, onboarding, payouts, refunds, disputes, reserves, or webhooks.

## 8. Data, money, email, and auth guardrails

Never use or expose secrets, live data, private user or customer data, real money, real email, or production auth. Use fixtures and non-production resources only when the task explicitly permits them.

- **Data:** `packages/db` remains the schema source of truth. No live Supabase SQL, migrations, PostGIS changes, RLS changes, storage writes, customer-data access, or destructive operations without approval. Product intent and access rules must be resolved before production data work.
- **Money:** Stripe Connect is blocked until the legal entity, marketplace/operator role, tax, KYC, payout, refund, dispute, reserves, and support model are approved. No live bid charge, transfer, payout, refund, product/price, account, or webhook action.
- **Email:** No production sending, sender/domain activation, DNS change, recipient import, or mail-routing mutation. Production mail is a current blocker.
- **Auth:** No production Clerk activation or user, role, permission, RLS identity mapping, or session-policy mutation. Production auth is a current blocker.

Anything money-moving, legally binding, destructive, schema-breaking, or permission-changing requires explicit human approval.

## 9. Design notes

Preserve the existing map-first, mobile-first, card-first design cues, the Inventory Unit hierarchy, and curated host-selection flow. The design needs further resolution, so avoid incidental redesign, a competing visual system, or UI decisions that silently determine unresolved product policy.

Maintain the implementation/source-of-truth doctrine and monorepo boundaries:

- `apps/` owns web, mobile, and later API surfaces.
- `packages/db/` owns SQL migrations and the Postgres/PostGIS schema.
- `packages/ui/` and `packages/core/` own shared UI and domain logic.
- `docs/` owns deduplicated decisions, architecture, data model, API, roadmap, go-to-market, and integration documentation.

D023 is the web design authority: Fraunces and Instrument Sans, plaster/structural ink, survey orange for commitment, blueprint blue for spatial/live context, flat drafting geometry, and the semantic Phosphor registry. Preserve accessibility, clear card composition, map/card parity, and touch-friendly mobile behavior; do not add a competing icon or component system.

The pinned baseline remains Windows 11 ARM64 → WSL2 Ubuntu 24.04, Node 24.16.0, pnpm 10.12.4, Turborepo, and TypeScript end to end. CI uses the organization reusable workflow. Runtime, dependency, package-boundary, or provider changes require an explicit dated decision.

## 10. Current known PRs and blockers

As of **2026-07-12**, there are no open PRs. Re-check before starting or reporting work.

Known blockers are dependency strategy; the final domain; RLS and product intent; production auth and mail; external end-to-end proof; and the Connect legal/operating model covering legal entity, operator role, tax, KYC, payouts, refunds, disputes, reserves, and support. The current security-risk and design-needed labels remain until evidence and approved decisions clear them.

## 11. Output format for future agents

Every handoff or PR report must include:

- branch and HEAD;
- scope, owned artifacts, and files changed;
- exact commands run and their results;
- explicit provider/live actions (`none` normally);
- data, money, email, and auth impact;
- screenshots and accessibility evidence for UI work;
- risks, blockers, assumptions, and unrun checks; and
- PR URL, or `none` with the reason.
