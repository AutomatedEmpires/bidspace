# BidSpace — Code/Schema Alignment Audit (2026-06-03)

Full audit of everything built so far (Phases 1–4, merged to `main`) against the canonical schema in `packages/db/migrations/*.sql` (D017). Goal: ensure the codebase is **aligned, sane, justified, defendable, and world-class** before Phase 5.

## Scope
- `packages/db/migrations/0001–0007` (schema = source of truth)
- `packages/core` (enums, money, state machines, validation)
- `packages/db` (row types, client)
- `packages/services` (venues, events, opportunities, inventory units, bidding)

## Method
Read every migration and every shipped TypeScript module, then diffed column names, types, nullability, and enum membership between the SQL schema and the TS contracts/services. Anything that would fail at insert time, or that silently disagreed with the schema, was treated as a defect.

## Findings & resolutions

### Critical (would fail at runtime)
1. **Money unit inconsistency.** Schema mixed `numeric` dollars (`opportunities.minimum_bid`, `inventory_units.minimum_bid/buy_now_price/reserve_price`, `bids.amount`/`counter_amount`, `bid_preferences.amount`, `bookings.price`) with `bigint` cents (`payments.*_cents`), while `core/money.ts`, validation (`minimumBidCents`), and services all assumed integer cents.
   - **Fix:** Normalized **all** money to `*_cents bigint` in migrations `0005`/`0006` (safe — nothing is deployed yet; migrations are the spec). Locked as **D020**. Columns renamed: `minimum_bid_cents`, `buy_now_price_cents`, `reserve_price_cents`, `amount_cents`, `counter_amount_cents`, `price_cents`.
2. **`venues` address column drift.** Service + `VenueRow` used `address_line1`; schema is `address_line_1` (plus `address_line_2`, `postal_code`, `country`). Inserts would have thrown.
   - **Fix:** Corrected `VenueRow`, `venueCreateSchema`, and `createVenue` to the real columns; `venue_type` is now the `venue_type` enum (was free text).
3. **`events` service broken vs schema.** Schema requires `event_type` (enum, NOT NULL) and non-null `starts_at`/`ends_at`; the service omitted `event_type` and treated dates as optional — every insert would have failed.
   - **Fix:** Added `eventCreateSchema` (required `eventType` enum + required `startsAt`/`endsAt` with a range refinement) and rewrote `createEvent` to insert `event_type`, `starts_at`, `ends_at`, `timezone`, and a default `status`.

### Correctness / completeness
4. **Incomplete core enum set.** `core/enums.ts` mirrored ~16 of the 31 schema enums.
   - **Fix:** Added all missing enums with exact literals from `0002_enums.sql`: membership_status, organization_member_role, role_profile_status, venue_type, venue_status, zone_type, event_type, event_status, collection_type, collection_status, verification_type, verification_subject_type, document_type, document_status, message_thread_context, performance_metric_source, admin_action_type.
5. **DB row-type drift.** `BidRow`/`BookingRow`/`PaymentRow`/`ReviewRow` had wrong or missing columns (e.g. `BookingRow.amount_cents` vs schema `price_cents`; `ReviewRow.author_/subject_` vs schema `reviewer_/reviewed_`; missing `host_organization_id`, `counter_amount_cents`, `currency`, payer/payee).
   - **Fix:** Rewrote the affected row interfaces to match the schema exactly; added a shared `GeoPoint` type.

## Decisions locked as part of this audit
- **D018** — Platform fee = 10% seller-side commission (resolves O1).
- **D019** — Sealed bids by default; host sees all (resolves O2).
- **D020** — Money stored/computed in integer cents.
- **D021** — Integration providers locked (registry: `docs/INTEGRATIONS.md`).

## Residual risks / follow-ups
- Hand-authored row types remain a stand-in until `pnpm --filter @bidspace/db gen:types` runs against a live Supabase project; regenerate before launch.
- Phase 3 (Clerk auth + onboarding, Copilot-built) lands separately and must be re-audited against this aligned core when its PR opens.
- Bidding/booking/payment **services** (Phase 6) are not yet built; only the bid-acceptability guard exists.

## Verdict
After this remediation, the merged foundation (core → db → services) is internally consistent and faithfully reflects the canonical schema. **Aligned and defendable.** Cleared to proceed to Phase 5 (spatial discovery).
