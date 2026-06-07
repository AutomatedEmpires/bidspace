# BidSpace — Agent Operating Contract

> **Binding contract for every agent (human or AI) that touches this repo. Read it fully before doing anything.**
> Aligned to the Explore&Earn (E&E) doctrine. BidSpace is one of the apps in the AutomatedEmpires venture system; E&E is the reference implementation.

## 0 · Prime doctrine
**Notion decides and builds. GitHub reviews and ships. Figma shows. Everything else runs.**

- **Notion** = product & vision truth (what we build and why), and where the bulk of the build — specs, architecture, data models, copy — is authored before code moves.
- **This repo** = implementation truth (how it is actually built); GitHub validates, reviews, and ships what Notion produced.
- Product/vision conflict → Notion decides. Implementation conflict → this repo decides. (See `docs/DECISIONS.md` D022, which supersedes D017's "repo wins on everything.")

## 1 · What BidSpace is
A Level 3 spatial-commerce marketplace: hosts turn physical space + audience traffic into geolocated, biddable **Inventory Units**; bidders compete; host selection is curated (highest bid does not auto-win). Map-first, mobile-first, card-first. See `README.md` and `docs/` for the canonical spec.

## 2 · The machine (where this is built)
All apps are built on ONE machine. Assume exactly:
- Windows 11 ARM64 (Snapdragon X Elite) → WSL2 Ubuntu 24.04 → VS Code
- Working path: `/home/jackson/automatedempires/ventures/bidspace`
- 16 GB RAM. **One agent at a time** — do not assume parallel heavy builds or long-running watchers.

## 3 · Runtime (pinned — do not drift)
- Node **24.16.0** (`.nvmrc`)
- pnpm **10.12.4** (`packageManager` in `package.json`)
- Turborepo monorepo
- Any version change requires a new dated decision in `docs/DECISIONS.md`.

## 4 · Integration spine (cross-app standard)
Shared providers across all AutomatedEmpires apps. Do not introduce alternates without a dated decision.

| Concern | Provider |
|---|---|
| Secrets | Doppler |
| Hosting | Vercel |
| Database | Supabase Postgres (+ PostGIS for spatial) |
| **Auth** | **Clerk** (standardized across all apps) |
| **Maps** | **Mapbox** (standardized across all apps) |
| Payments | Stripe Connect |
| Media | Cloudinary |
| Observability | PostHog + Sentry |
| Icons | Streamline (single icon system) |
| Language | TypeScript end-to-end |
| Surfaces | Web: Next.js · Mobile: Expo / React Native |

## 5 · Repo layout
- `apps/` — web (Next.js), mobile (Expo), api (later)
- `packages/db/` — SQL migrations (Postgres + PostGIS); schema source of truth
- `packages/ui/`, `packages/core/` — shared UI + domain logic
- `docs/` — canonical, deduped spec (DECISIONS, ARCHITECTURE, DATA-MODEL, API, ROUTES, SCREENS-AND-CARDS, TRUST-AND-SCORING, ROADMAP, GTM, INTEGRATIONS)

## 6 · How we work
- **Communicate through durable artifacts.** Issues, PRs, and `docs/` are the memory. If it is not written down, it did not happen.
- **Builder is never the approver.** Open a PR; do not merge your own work without review.
- **One owner per area.** Hand off via artifacts, not assumptions.
- **Respect founder gates.** Anything money-moving, legally binding, destructive, or schema-breaking waits for explicit founder sign-off.
- **Cite canon.** When implementing from a decision or Notion spec, reference it (e.g. "implements D006 / Notion: BidSpace spec").
- **Canon parity.** Changes touching routes, cards, trust/scoring, or economics must match `docs/ROUTES.md`, `docs/SCREENS-AND-CARDS.md`, `docs/TRUST-AND-SCORING.md`, and `docs/DECISIONS.md` — and cite the decision. If the canon is wrong, update Notion + these docs first.

## 7 · GitHub management
- Work on lane/feature branches → small PRs → review → merge. Never push straight to `main`.
- CI (`.github/workflows/ci.yml`) calls the org-shared reusable workflow (`AutomatedEmpires/.github/.github/workflows/reusable-ci.yml`) and runs typecheck + lint + build (+ tests when present) on every PR; keep it green.
- Use phase/area labels consistently and tie PRs to issues.
- Notion ↔ GitHub sync mirrors issues/PRs into Notion for lane agents (live).

## 8 · Cross-app alignment
E&E is the reference. E&E, BidSpace, Sweepza, and LogLoads share the same doctrine, machine, runtime, and integration spine so an agent moving between repos reads one contract. Differences are product scope only, never workflow. See `docs/AGENT-ALIGNMENT-NOTES.md` for what was aligned and why.
