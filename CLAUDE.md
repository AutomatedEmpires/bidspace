# Claude Code — BidSpace

This repository follows a single, binding agent contract. Read it first:

@AGENTS.md

## Local constraints (do not ignore)
- **One agent at a time.** Build machine is a 16 GB ARM64 laptop (Snapdragon X Elite) on WSL2 Ubuntu 24.04. No parallel heavy builds.
- **Runtime is pinned:** Node 24.16.0 (`.nvmrc`), pnpm 10.12.4 (`package.json`). Do not change versions without a dated decision in `docs/DECISIONS.md`.
- **Source of truth:** Notion = product/vision truth; this repo = implementation truth (see AGENTS.md §1 and DECISIONS D022).
- **Standardized providers:** Clerk (auth), Mapbox (maps), Supabase Postgres+PostGIS, Stripe Connect, Doppler, Vercel, PostHog, Sentry, Cloudinary.
