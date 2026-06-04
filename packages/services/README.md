# @bidspace/services

The transport-agnostic **use-case / API layer** for BidSpace. These functions are
the single place where business rules live; HTTP route handlers in `apps/web`
(and any future workers) call into them and translate the typed errors below into
responses.

## Design rules
- Every mutation validates input with the zod schemas from `@bidspace/core`.
- Every status change goes through the canonical **state machines** in
  `@bidspace/core` — illegal transitions throw `TransitionError`, never reach the DB.
- Data access uses the `BidspaceClient` from `@bidspace/db`. No second Supabase client.
- Money is always integer cents.

## Surface (Phase 4)
- **venues**: `createVenue`, `getVenue`, `listVenuesForOrg`
- **events**: `createEvent`, `getEvent`, `listEventsForOrg`
- **opportunities**: `createOpportunity`, `getOpportunity`, `listOpportunitiesForOrg`, `transitionOpportunity`
- **inventory units**: `createInventoryUnit`, `getInventoryUnit`, `listInventoryUnitsForOpportunity`, `transitionInventoryUnit`
- **bidding (guard only)**: `assertBidAcceptable` — full bid placement is Phase 6, blocked on O1/O2.

## Errors
`ServiceError` (base), `NotFoundError`, `ValidationError`, `TransitionError`.

## Not in this layer
HTTP routing, auth/session resolution (Clerk — Phase 3), Stripe/payment capture and
Mapbox search (Phase 6 / Phase 5). Those compose on top of these functions.
