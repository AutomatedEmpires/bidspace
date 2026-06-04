# @bidspace/db

Postgres + PostGIS schema and migrations. Source of truth for the data model.

## Migrations (run in order)
- `0001_extensions.sql` — pgcrypto, postgis, citext, shared `set_updated_at()` trigger fn
- `0002_enums.sql` — all enum types
- `0003_identity.sql` — users, organizations, memberships, role profiles
- `0004_locations.sql` — venues, zones, events, collections
- `0005_marketplace.sql` — opportunities, inventory units
- `0006_transactions.sql` — bids, bid preferences, bookings, payments
- `0007_trust.sql` — messaging, reviews, documents, verifications, performance data, admin actions

## Apply locally (Supabase CLI)
    supabase start
    for f in migrations/0*.sql; do psql "$DATABASE_URL" -f "$f"; done

## Conventions
- UUID PKs (`gen_random_uuid()`).
- Money stored as integer cents (`*_cents bigint`).
- Soft-delete via `archived_at` / `deleted_at` where history matters.
- Geospatial via PostGIS `geography(Point|Polygon, 4326)`; GIST indexes on spatial columns.
- Organizations own marketplace objects; users act through memberships.
