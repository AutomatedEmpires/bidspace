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
