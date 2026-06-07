# API & Transport

> **Transport (D025, LOCKED).** First-party flows use **Next.js App Router server actions** → typed service layer (`@bidspace/services` / `@bidspace/db`) → `revalidatePath`. Auth + active-org context is resolved **server-side via Clerk**, never trusted from client input or headers. **There is no bespoke REST API for the app's own screens.** Route handlers (`app/api/...`) are reserved for **webhooks / third-party callbacks** (e.g. Stripe) and for any explicitly **public/partner** API surface. The resource map below is the **logical resource model** those server actions operate on — and the shape a future public REST surface would take — not a mandate to build `/api/v1/*` for first-party UI.

## Logical resource model
The canonical objects and the operations exposed over them (as server actions for first-party use; as REST only if/when a public API is built).

| Resource | Operations |
|---|---|
| Organizations | list/create, get/update |
| Memberships | list/create members, update/remove member |
| Role Profiles | list/create, update |
| Venues | list/create, get/update, list zones |
| Events | list/create, get/update |
| Collections | list/create, get/update |
| Opportunities | list/create, get/update |
| Inventory Units | list/create, get/update, **search** (PostGIS radius) |
| Bids | list/create, get/update (accept/reject/counter/waitlist via status) |
| Bookings | list, get/update |
| Payments | create, get |
| Reviews | list/create |
| Verifications | list/create, update |
| Documents | list/create |
| Messages | list/create |

## Reserved REST (route handlers only)
- **Webhooks:** `POST /api/webhooks/stripe` (and future provider callbacks). Signature-verified; not part of the first-party app transport.
- **Public / partner API (future, not MVP):** would be versioned under `/api/v1`, cursor-paginated (`?limit=&cursor=`), and documented with an OpenAPI 3.1 spec. Tracked as a follow-up; do not build for first-party screens.

## Conventions
- **First-party mutations are server actions** that validate org membership + role server-side (Clerk) before touching the service layer. Never accept the acting org id from client input.
- **Reads** go through the typed service/DTO layer (`@bidspace/services`), never raw rows to the client.
- **Money in integer cents** (D020), currency explicit; render via the shared money formatter.
- **Sealed bids (D019):** viewer-scoped reads only; never leak competing bid data to bidders.
- List operations use cursor pagination (`limit` + `cursor`).
