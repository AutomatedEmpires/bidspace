# Agent Alignment Notes — BidSpace

> **Date:** 2026-06-03 · **Author:** Teach (founder's Notion agent) · **Branch:** `chore/cross-app-alignment`
> Handoff note for every agent working on BidSpace, Sweepza, or Explore&Earn. Read this with `AGENTS.md`.

## The system you are part of
Three apps — **Explore&Earn (E&E)**, **BidSpace**, **Sweepza** — are built by one founder (Jackson / "Caveman") under the **AutomatedEmpires** GitHub org, coordinated through Notion. They are run as one venture system with **one shared doctrine, one machine, one runtime, and one integration spine.** Only product scope differs between them.

**E&E is the reference implementation.** When in doubt about workflow, runtime, or repo conventions, copy what E&E does. This alignment pass brought BidSpace up to the E&E standard.

## Prime doctrine
**Notion decides. GitHub builds. Figma shows. Everything else runs.**
- Notion = product & vision truth. This repo = implementation truth.
- Product/vision conflict → Notion. Implementation conflict → repo. (DECISIONS D022.)

## The machine (all three apps build here)
- Windows 11 ARM64 (Snapdragon X Elite) → WSL2 Ubuntu 24.04 → VS Code.
- Path: `/home/jackson/automatedempires/ventures/<app>`.
- **16 GB RAM — one agent at a time.** No parallel heavy builds / long watchers. Claude Code is installed but not subscribed; do not assume it.

## Runtime (pinned across all apps)
- Node **24.16.0** (`.nvmrc`) · pnpm **10.12.4** (`packageManager`) · Turborepo.
- Version changes require a dated decision in `docs/DECISIONS.md`.

## Integration spine (cross-app standard)
Secrets **Doppler** · Hosting **Vercel** · DB **Supabase Postgres** (+PostGIS for spatial) · **Auth = Clerk** · **Maps = Mapbox** · Payments **Stripe Connect** · Media **Cloudinary** · Observability **PostHog + Sentry** · Icons **Streamline** · **TypeScript** · Web **Next.js** / Mobile **Expo/RN**.

## Flows / how we work
- Durable artifacts are the memory: Issues, PRs, `docs/`. If it isn't written, it didn't happen.
- Lane branch → small PR → review → merge. **Never push to `main`.** Builder ≠ approver.
- Founder gates: anything money-moving, legally binding, destructive, or schema-breaking waits for explicit founder sign-off.
- Cite the decision/Notion spec you are implementing.

## What this PR changed (and why)
1. **Added `AGENTS.md`** — binding agent contract (was missing; E&E has one). Single source for doctrine + runtime + spine.
2. **Added `CLAUDE.md`** — thin pointer to `AGENTS.md` + hard local constraints.
3. **Added `.mcp.json`** — Notion MCP server, so agents in-repo reach product truth.
4. **Pinned runtime** — `.nvmrc` 20 → **24.16.0**; `package.json` pnpm 9.0.0 → **10.12.4**, added `engines.node >=24.16.0`, turbo ^2.0.0 → **^2.5.4**, TS ^5.4.0 → **^5.8.3**. Brings BidSpace onto the shared toolchain.
5. **Reconciled source-of-truth** — `README.md` + `docs/DECISIONS.md`: added **D022** (Notion=product truth, repo=implementation truth), marked D017's blanket "repo wins" partially superseded. (Renumbered from the originally-drafted "D018" to **D022** to avoid colliding with the already-merged economics decisions D018–D021.)
6. **CI (pending)** — `.github/workflows/ci.yml` (typecheck + lint + build on PRs) is specified in `AGENTS.md` but not yet committed; the connected GitHub app lacks `workflows` permission. Founder to add it (or re-auth with workflow scope).

## What did NOT change (important)
- **Auth and maps were already compliant.** BidSpace already uses **Clerk** (D013) and **Mapbox** (D014) — these ARE the cross-app standard. Nothing to migrate here.
- **E&E is the outlier on auth/maps**, not BidSpace. E&E currently uses Supabase Auth + Azure Maps and has a separate migration issue to move to Clerk + Mapbox. Do not "fix" BidSpace to match E&E's current auth/maps — it is the other way around.

## What to do next (for the agent picking this up)
- Review and merge this PR (founder is the approver).
- Add the CI workflow file (needs `workflows` permission), then keep CI green.
- Stand up the Notion ↔ GitHub issue/PR sync so lane agents see work in Notion.
- When E&E's Clerk/Mapbox migration lands, confirm all three apps share identical auth/map provider config.
