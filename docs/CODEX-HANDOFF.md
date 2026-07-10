# BidSpace → Production: Handoff for Codex (computer/browser control)

**Written 2026-07-10 by Claude (Sonnet), repo-resident, no browser/computer control this session.**
You (Codex) have the founder's computer + browser. This is everything you need to
**provision, verify, and fix** BidSpace to a real public launch. Founder has read
and approved the two decisions in §0.

The app is **software-complete and already partly live** — auth, maps, and error
tracking are wired and browser-verified. What remains is mostly account
provisioning that needs a human/dashboard, plus a deploy.

---

## 0 · Founder decisions (2026-07-10) — binding

1. **BidSpace gets a DEDICATED Stripe account.** Not the shared
   `acct_1SpxXpDtcwz0cxzo` (Sweepza/LogLoads), not `acct_1RMjIWIH4Hw2pSG9`
   ("explore&earn", which the claude.ai Stripe connector happens to be bound to).
   Create a **new** Stripe account for BidSpace.
2. **Every venture is a separate entity with its own accounts for everything.**
   → This means two things I wired inside shared AutomatedEmpires accounts should
   be **migrated to dedicated BidSpace accounts** (see §5): the Sentry project
   currently lives in the shared `automated-empires` Sentry org, and the Mapbox
   token belongs to the shared `automatedempires` Mapbox account.

---

## 1 · Coordinates

| Thing | Value |
|---|---|
| Repo | `AutomatedEmpires/bidspace` |
| Branch | `integration/recovered-bidspace-product` → **PR #58** (base `main`, mergeable, CI green) |
| WSL path | `/home/jackson/automatedempires/ventures/bidspace` (Ubuntu-24.04-Recovered) |
| App | `apps/web` (Next.js 16.2.7, Turborepo monorepo, pnpm 10.12.4, Node 24.16.0) |
| Supabase | project **`bidspace`** `hnjjcgxflxlfsqslgxcv` (us-west-1) — migrations 0001–0011 + seed applied |
| Doppler | project **`bidspace`**, configs `dev`/`stg`/`prd`. **`dev` already holds every non-Stripe secret.** |
| Local run | `cd apps/web && set -a && source .env.local && set +a && npx next start -p 3004 -H 0.0.0.0` — reachable at the WSL eth0 IP (`hostname -I`) port 3004 |

`.env.local` is gitignored and mirrors Doppler `dev`. **Never commit it.**

---

## 2 · Already DONE + verified — do NOT redo

- **Software**: 43 routes, typecheck 5/5, 64 unit tests, green build, CI green.
- **Internal money loop**: `tools/live-loop-check.ts` proves bid→counter→accept→
  award→booking→payment→settlement against the live DB — **$280 gross / $28 fee
  (10%, D018) / $252 payout**. `tools/live-duplicate-check.ts` proves recurring
  copy-forward. Refund + dispute webhooks implemented.
- **Stripe Connect architecture (D028)**: controller-property accounts
  (Express-equivalent, off deprecated `type:express`) + destination charges +
  idempotent, crash-safe webhook settlement. Code done; needs an account.
- **Clerk**: dedicated BidSpace **dev** app is LIVE + browser-verified. Instance
  `factual-puma-97.clerk.accounts.dev`, Organizations enabled, Google OAuth +
  email. App no longer 500s; sign-in widget mounts; `/dashboard` gates. Keys in
  Doppler `dev` + `.env.local`.
- **Mapbox**: token wired + verified (`/map` renders real tiles + all 5 seeded
  positions). ⚠️ token is from the shared `automatedempires` account → §5.
- **Sentry**: project `bidspace` wired + event delivery proven (issue
  `BIDSPACE-1`). ⚠️ lives in the shared `automated-empires` org → §5.
- Docs: `PRODUCTION-ACTIVATION.md`, `CONNECT-RUNBOOK.md`, `MONEY-PROOF-FIXTURE.md`,
  `CLERK-CONTRACT.md`, `ENVIRONMENT.md`, `DECISIONS.md` (D023–D028).

---

## 3 · TASK A — Dedicated Stripe account + prove real money (biggest task)

The app reads `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` from env — it is fully
decoupled from whatever the claude.ai Stripe connector is bound to. So this is
purely: create account → get keys → set env → register webhook → prove.

1. Create a **new dedicated BidSpace Stripe account** (dashboard.stripe.com,
   separate login/business entity per §0).
2. **Enable Connect** → complete the **platform profile** (this is where you
   acknowledge platform liability for negative balances — required because the
   code sets `controller.losses.payments = application`).
3. **KYC**: company details, EIN, beneficial owners, bank account. *(Founder must
   do the identity parts.)*
4. Copy keys. **Test mode first**: `STRIPE_SECRET_KEY` (sk_test) →
   Doppler `bidspace/dev`; live (sk_live) → `bidspace/prd` later.
5. **Webhook**: Developers → Webhooks → Add endpoint →
   `https://<vercel-host>/api/stripe/webhook`. Subscribe to EXACTLY these 5:
   `checkout.session.completed`, `checkout.session.expired`,
   `payment_intent.payment_failed`, `charge.refunded`, `charge.dispute.created`.
   Copy the signing secret → `STRIPE_WEBHOOK_SECRET`.
6. **Prove the loop** using `docs/MONEY-PROOF-FIXTURE.md` (exact seeded
   host/vendor/unit + expected DB + Stripe objects): host connects payouts at
   `/host/settings` → vendor bids $280 → host awards → vendor pays with test card
   `4242…` → assert payment `paid`, fee `2800`, payout `25200`, booking
   `confirmed`, unit `booked`. Then repeat once live with a real card you refund.

Full detail: `docs/CONNECT-RUNBOOK.md`.

---

## 4 · TASK B — Vercel deploy (unblocked; needs dashboard)

The Clerk **dev** instance works on any origin incl. `*.vercel.app`, so a
preview/soft-launch deploy works today. The Vercel MCP is deploy-only (no env
API), which is why this needs your dashboard control.

1. Vercel → **Import** `AutomatedEmpires/bidspace` (team **AutomatedEmpires**,
   `team_0IgwjPKkR3NmPUC5ugTK3cfi`).
2. **Root Directory = `apps/web`**. Framework auto-detects Next.js. `vercel.json`
   is committed (api `maxDuration: 30`). Build via Turborepo; pnpm install.
3. **Env (Production scope)**: connect the Doppler↔Vercel integration for project
   `bidspace` (cleanest), OR paste the vars from `docs/ENVIRONMENT.md`. Set
   `NEXT_PUBLIC_SITE_URL` to the assigned `*.vercel.app` host.
   **Gotchas (important):**
   - `NEXT_PUBLIC_*` vars are **inlined at build time** — they must be set in
     Vercel *before/at* build, not just runtime. (This bit me locally: had to
     rebuild after setting them.)
   - `CLERK_ENCRYPTION_KEY` is **required in prod** or every request 500s
     (`proxy.ts` passes `secretKey` explicitly). Generate: `openssl rand -hex 32`.
   - `getRequiredEnv("CLERK_PUBLISHABLE_KEY")` checks `CLERK_PUBLISHABLE_KEY`
     *before* the `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` alias — set both to the real
     value; don't leave a stale placeholder in the first.
4. Deploy. Prefer deploying from `main` — **merge PR #58 first** (builder isn't
   the approver; that's you/founder).
5. **Verify**: HTTPS; `/`, `/explore`, `/map` (real tiles) render; sign-up works;
   protected routes gate; `/api/stripe/webhook` reachable.
6. **Known risk to watch** (not reproduced locally on Next 16, seen on a sibling
   venture's Next 15 Vercel build): `Could not find the module
   ".../app/global-error.tsx#default" in the React Client Manifest`. If it
   appears post-deploy, Sentry will now catch it; fix by simplifying/guarding
   `global-error.tsx` per that error.

---

## 5 · TASK C — Dedicate the shared-account integrations (per §0.2)

I wired these into shared AutomatedEmpires accounts to prove them; migrate to
dedicated BidSpace accounts:

- **Sentry**: currently project `bidspace` inside org `automated-empires`
  (https://automated-empires.sentry.io/projects/bidspace/). If strict per-entity
  separation is wanted, create a **dedicated BidSpace Sentry org**, make a
  project, and swap `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN` (+ `SENTRY_ORG`,
  `SENTRY_PROJECT`, optional `SENTRY_AUTH_TOKEN` for source maps) in Doppler.
  Verify with `tools/verify-sentry.ts` (fires a test event; confirm it lands).
- **Mapbox**: current token is under the shared `automatedempires` account and is
  **unrestricted**. Create a **dedicated BidSpace Mapbox account**, mint a public
  token, **restrict it by URL to the prod host**, swap `NEXT_PUBLIC_MAPBOX_TOKEN`.
  Verify `/map` still renders.

---

## 6 · TASK D — PostHog (dedicated project)

Not yet wired (no key). The app is fully instrumented and env-gated on
`NEXT_PUBLIC_POSTHOG_KEY`. Create a **dedicated BidSpace PostHog project**
(app.posthog.com), set the key in Doppler. 7 server events + client `$pageview`
then flow (distinct_id = org uuid, no PII). Verify events land in PostHog →
Activity by clicking through the app.

---

## 7 · TASK E — Canonical browser E2E (after Clerk+Stripe+deploy)

Spec already written: `apps/web/e2e/marketplace-loop.spec.ts` (Playwright,
env-gated, self-skips without creds). Full journey: host signup→onboard→publish
→ vendor signup→bid → host counter → vendor accept → pay → booking + fee correct.
Run:
```
cd apps/web && pnpm e2e:install   # one-time: chromium
BIDSPACE_E2E_BASE_URL=https://<host> \
BIDSPACE_E2E_HOST_EMAIL=… BIDSPACE_E2E_HOST_PASSWORD=… \
BIDSPACE_E2E_VENDOR_EMAIL=… BIDSPACE_E2E_VENDOR_PASSWORD=… \
pnpm --filter @bidspace/web e2e
```
(Requires two Clerk test users with password auth, or adapt to Clerk testing
tokens.)

---

## 8 · TASK F — Clerk production instance (only when a domain exists)

Current dev instance is fine for a `*.vercel.app` soft-launch (shows "Development
mode", has rate limits). A Clerk **production** instance requires a **custom
domain** (`clerk.<domain>` CNAME). Deferred until the founder picks a domain.
When that happens: create the prod instance, set the prod keys in `bidspace/prd`,
add the domain to allowed origins. See `docs/CLERK-CONTRACT.md`.

---

## 9 · Verification toolbox (all exist, all runnable)

| Command | Proves |
|---|---|
| `pnpm typecheck && pnpm lint && pnpm test && pnpm --filter @bidspace/web build` | code health (5/5, 64 tests, green) |
| `set -a && source apps/web/.env.local && set +a && pnpm --filter @bidspace/web exec tsx ../../tools/live-loop-check.ts` | full money loop against live DB |
| `… tsx ../../tools/live-duplicate-check.ts` | recurring copy-forward |
| `… tsx ../../tools/verify-sentry.ts` | Sentry event delivery |
| headless Chromium at `~/.cache/ms-playwright/chromium-1228/chrome-linux/chrome` | screenshot any route (`--use-gl=angle --use-angle=swiftshader` for the map) |

---

## 10 · Definition of OPERATING

- [x] Software complete, internal money loop verified
- [x] Auth live + browser-verified (Clerk dev)
- [x] Maps live + browser-verified (Mapbox)
- [x] Error tracking live + proven (Sentry)
- [ ] Dedicated Stripe account + KYC + webhook + **real** money loop proven
- [ ] Public deploy (Vercel) verified over HTTPS
- [ ] Dedicated Sentry + Mapbox + PostHog accounts (per separate-entity rule)
- [ ] Browser E2E green
- [ ] (later) Clerk production instance on a custom domain

Everything unchecked is an account/dashboard action you can now do. The code is
ready and out of the way.
