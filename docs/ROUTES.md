# Routes (Canonical) `LOCKED`

Mirrors the BidSpace Notion canon "Routes, Screens & Card System." Under D022, Notion holds product/vision truth; this file is its in-repo mirror. Build agents follow this exactly. Any change requires a dated decision in `docs/DECISIONS.md` and a matching Notion update.

## Route contract (LOCKED 2026-06-05)
- **Public detail pages use a `slug`, never a raw DB id.** The server resolves `slug -> id`. Slugs are stable and SEO-readable.
- **Authenticated surfaces live under the role namespace `/app/{bidder|host|network}/...`** — never flat top-level role pages. Internal entity sub-routes may use ids (e.g. `/app/host/bids/[id]`).
- **Admin lives under `/admin/...`**, isolated from `/app`.

### Known drift to re-key (see issue: route contract adoption)
| Current (drift) | Canonical |
|---|---|
| `/units/[unitId]` | `/inventory/[slug]` |
| `/dashboard` (flat) | `/app/{role}/dashboard` |
| `/onboarding` (flat) | `/app/onboarding` |

## Public
`/home` · `/discover` · `/inventory/[slug]` · `/opportunities/[slug]` · `/venues/[slug]` · `/hosts/[slug]` · `/bidders/[slug]` · `/collections/[slug]` · `/pricing`

## Auth — Bidder (`/app/bidder/`)
dashboard · discover · saved · bids · bookings · profile · documents · analytics

## Auth — Host (`/app/host/`)
dashboard · inventory · inventory/new · opportunities · opportunities/new · bids · bids/[id] · bookings · venues · events · messages · reviews · analytics

## Network / Enterprise (`/app/network/`)
dashboard · collections · templates · reporting

## Admin (`/admin/`)
dashboard · users · organizations · inventory · opportunities · bids · bookings · payments · verification · disputes · reviews · intelligence

## Build priority
**MVP routes:** home, discover, inventory detail, signup/login, onboarding org, bidder dashboard, host dashboard, host inventory + create, submit bid, host bid pipeline, bookings, admin verification + basic payments/disputes.

**Later:** network dashboard, advanced analytics, intelligence admin, full collections, floorplan editor, public bidder profiles.
