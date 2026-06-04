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

## MVP scope
Auth · multi-role onboarding · host & bidder profiles · venue/event/opportunity/inventory creation · map+list discovery · unit detail · bid submission · host bid pipeline · accept/reject/waitlist · Stripe payment · booking confirmation · basic messaging · reviews · admin verification.

**Not in MVP:** advanced AI scoring, automated auction close, drag-and-drop floorplan editor, sponsorship/venue marketplace expansion, full ROI analytics, ticketing.

## Versions
- **V1** — messaging, better search, saved searches, notifications, host/bidder analytics.
- **V2** — spatial tools: unit pin manager, zone manager, floorplan uploads, bid map, assisted allocation.
- **V3** — intelligence: TrafficScore, VisibilityScore, pricing recommendations, saturation warnings.
- **V4** — network/enterprise: multi-location, collections, templates, bulk publishing, enterprise billing.
