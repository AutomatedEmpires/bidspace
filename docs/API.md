# API Resource Map (REST)

Base: `/api/v1`. Auth via Clerk session; org context via `X-Org-Id`. Full OpenAPI 3.1 spec is a tracked follow-up.

| Resource | Endpoints |
|---|---|
| Organizations | `GET/POST /organizations`, `GET/PATCH /organizations/:id` |
| Memberships | `GET/POST /organizations/:id/members`, `PATCH/DELETE /members/:id` |
| Role Profiles | `GET/POST /role-profiles`, `PATCH /role-profiles/:id` |
| Venues | `GET/POST /venues`, `GET/PATCH /venues/:id`, `GET /venues/:id/zones` |
| Events | `GET/POST /events`, `GET/PATCH /events/:id` |
| Collections | `GET/POST /collections`, `GET/PATCH /collections/:id` |
| Opportunities | `GET/POST /opportunities`, `GET/PATCH /opportunities/:id` |
| Inventory Units | `GET/POST /inventory-units`, `GET/PATCH /inventory-units/:id`, `GET /inventory-units/search` (PostGIS radius/viewport), `GET /inventory-units/:id` (public detail payload) |
| Bids | `GET/POST /bids`, `GET/PATCH /bids/:id` (accept/reject/counter/waitlist via status) |
| Bookings | `GET /bookings`, `GET/PATCH /bookings/:id` |
| Payments | `POST /payments`, `GET /payments/:id`, `POST /webhooks/stripe` |
| Reviews | `GET/POST /reviews` |
| Verifications | `GET/POST /verifications`, `PATCH /verifications/:id` |
| Documents | `GET/POST /documents` |
| Messages | `GET/POST /messages` |

## Discovery query conventions

`GET /api/v1/inventory-units/search` backs the public `/discover` route and returns the same list-first units plus map-ready markers.

Supported query params:
- `type` — one `inventory_unit_type` enum value.
- `commerceLayer` — one `commerce_layer` enum value.
- `q` — lightweight text filter over the enriched unit card payload.
- `mode=viewport` with `minLat`, `minLng`, `maxLat`, `maxLng` for map-bound searches. Aliases: `south`, `west`, `north`, `east`.
- `mode=radius` with `lat`, `lng`, and `radiusMiles` for radius searches.
- `limit` — positive integer, capped by service guardrails.

Discovery remains inventory-unit-first. Public search only returns available/receiving/shortlisted units surfaced by the PostGIS RPCs; sealed bid amounts are not exposed because bidders only see their own bids once bid submission ships.

## Conventions
- Cursor pagination: `?limit=&cursor=`.
- All mutations validate org membership + role.
- Money in integer cents; currency explicit.
