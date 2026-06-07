# Roadmap & Build Sequence

## Build sequence (object-first)
1. DB schema + migrations (this PR)
2. Generated DB types + `core` domain package (money, bid lifecycle state machine)
3. Auth (Clerk) + Organizations + multi-role onboarding
4. Venue / Event / Opportunity / Inventory Unit CRUD + API
5. Map/list discovery (Mapbox + PostGIS radius search)
6. Inventory Unit detail page
7. Bid submission + host bid pipeline
8. Accept/reject/waitlist + Stripe Connect payment + Booking
9. Reviews + Verification + Admin
10. Performance data capture

## Status (as of 2026-06-06)

Legend: ✅ shipped to `main` · 🟨 partial (backend or platform surface) · ⬜ not started

| # | Area | Status | Notes |
|---|------|--------|-------|
| 1 | DB schema + migrations | ✅ | Tables, enums, PostGIS, RLS scaffolding. |
| 2 | `core` domain package | ✅ | `money` (integer cents, 10% fee), enums, state machines, zod validation, trust presentation + scoring. |
| 3 | Clerk auth + orgs + onboarding | ✅ | `apps/web` App Router shell, middleware org-context, onboarding → `organizations`/`organization_memberships`/`role_profiles`. Requires Clerk + Supabase env vars to build/run. |
| 4 | Venue/Event/Opportunity/Inventory CRUD + API | 🟨 | Service layer + validation in `@bidspace/services`; UI/route handlers pending. |
| 5 | Map/list discovery (Mapbox + PostGIS) | 🟨 | `searchNearbyUnits` / `searchUnitsInViewport` + RPCs shipped; map UI pending. |
| 6 | Inventory Unit detail page | ⬜ | UI not started. |
| 7 | Bid submission + host pipeline | 🟨 | Bidding service (`placeBid`, sealed-bid visibility, view/shortlist/accept/reject/waitlist/counter) shipped; submission + pipeline UI pending. |
| 8 | Accept/reject/waitlist + Stripe Connect + Booking | 🟨 | Payments service (split/fee, Stripe Connect destination-charge params, payment-before-booking) + booking service shipped; checkout UI + live Stripe wiring pending. |
| 9 | Reviews + Verification + Admin | 🟨 | Trust domain helpers, review/verification capture routes, and `/dashboard`, `/trust`, `/reviews`, `/admin` platform surfaces now exist with role-aware segmentation and empty/operator states. Verification criteria O4 remains open before public badges/claims; trust score is operational, not a guarantee. |
| 10 | Performance data capture | ⬜ | Not started. |

**Vision alignment (locked decisions):** integer-cents money (D020), 10% seller-side platform fee (D018), sealed bids with host-visible full view (D019), payment-before-booking with Stripe Connect destination charges (D021/D022). Service layer enforces all four on the locked spine; ratings/scores stay numeric and outside D020.

**Open decisions tracked in the BidSpace journal / issues:** O3 allocation policy (Phase 7–8 currently host-discretion accept/reject/shortlist), O4 verification criteria, O5 search-infra trigger, O6 legal/compliance.

## MVP scope
Auth · multi-role onboarding · host & bidder profiles · venue/event/opportunity/inventory creation · map+list discovery · unit detail · bid submission · host bid pipeline · accept/reject/waitlist · Stripe payment · booking confirmation · basic messaging · reviews · admin verification.

**Not in MVP:** advanced AI scoring, automated auction close, drag-and-drop floorplan editor, sponsorship/venue marketplace expansion, full ROI analytics, ticketing.

## Versions
- **V1** — messaging, better search, saved searches, notifications, host/bidder analytics.
- **V2** — spatial tools: unit pin manager, zone manager, floorplan uploads, bid map, assisted allocation.
- **V3** — intelligence: TrafficScore, VisibilityScore, pricing recommendations, saturation warnings.
- **V4** — network/enterprise: multi-location, collections, templates, bulk publishing, enterprise billing.
