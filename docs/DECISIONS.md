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

## Open (must lock before/at relevant phase)
- **O1 — Platform fee %** and who pays (host / bidder / split). *Before payments go live.*
- **O2 — Bid visibility** (do bidders see competing bid count/amounts?). *Before bid UX.*
- **O3 — Multi-unit allocation algorithm** beyond manual host selection. *V2.*
- **O4 — Verification badge pass/fail criteria** per type. *Before trust badges ship.*
- **O5 — Search infra trigger** (when to move beyond Postgres FTS). *Post-MVP.*
- **O6 — Legal & compliance registry** (contracts, liability, refunds by jurisdiction). *Before public launch.*
