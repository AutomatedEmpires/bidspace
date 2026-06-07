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
| Inventory Units | `GET/POST /inventory-units`, `GET/PATCH /inventory-units/:id`, `GET /inventory-units/search` (PostGIS radius) |
| Bids | `GET/POST /bids`, `GET/PATCH /bids/:id` (accept/reject/counter/waitlist via status) |
| Bookings | `GET /bookings`, `GET/PATCH /bookings/:id` |
| Payments | `POST /payments`, `GET /payments/:id`, `POST /webhooks/stripe` |
| Reviews | `GET/POST /reviews` |
| Verifications | `GET/POST /verifications`, `PATCH /verifications/:id` |
| Documents | `GET/POST /documents` |
| Messages | `GET/POST /messages` |

## Conventions
- Cursor pagination: `?limit=&cursor=`.
- All mutations validate org membership + role.
- Money in integer cents; currency explicit.

## Public web routes (App Router)

These are server-rendered pages in `apps/web`, not REST endpoints. They are public (allowlisted in `middleware.ts`) so the marketplace front door works before sign-in. Bidding actions still require auth.

| Route | Purpose |
|---|---|
| `/` | Marketing front door; routes into `/discover`. |
| `/discover` | List-first discovery surface with filters, results grid, and map preview. |
| `/inventory-units/[id]` | Inventory unit detail page with sealed-bid CTA. |

### `/discover` query params

Parsed by `parseDiscoverySearchParams` in `apps/web/lib/discovery.ts`. All are optional; unknown values fall back to defaults.

| Param | Type | Notes |
|---|---|---|
| `q` | string | Free-text search over unit/opportunity/host. |
| `type` | enum | One `INVENTORY_UNIT_TYPE` value (e.g. `vendor_space`). |
| `layer` | enum | One `COMMERCE_LAYER` value (e.g. `brand_exposure`). |
| `mode` | `list` \| `nearby` \| `viewport` | Location mode. Defaults to `list`. |
| `lat`, `lng` | number | Center point for `nearby` mode. |
| `radius` | number (km) | Search radius for `nearby` mode (default 50, max 250). |
| `minLng`, `minLat`, `maxLng`, `maxLat` | number | Bounding box for `viewport` mode. |
| `limit` | number | Result cap (default 60, max 120). |

### Discovery data flow

- `parseDiscoverySearchParams(searchParams)` → normalized `DiscoveryQuery`.
- `loadDiscoveryResults(query)` → `DiscoveryResults` (`status`, `cards`, `points`, `total`, `center`). `status` is `ok` \| `empty` \| `configuration_error` \| `error`; routes render empty/notice states accordingly instead of throwing.
- `loadInventoryUnitDetail(id)` → `UnitDetailResult` (`status` is `ok` \| `not_found` \| `configuration_error` \| `error`); `not_found` triggers the route `notFound()`.
- The data helper imports `server-only` and reads through `@bidspace/services` discovery functions, so the Supabase client never reaches the browser bundle.
