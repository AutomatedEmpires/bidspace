# Data Model

The authoritative schema lives in [`packages/db/migrations`](../packages/db/migrations). This doc is the map.

## Core objects
User, Organization, Organization Membership, Role Profile, Venue, Venue Zone, Event, Inventory Collection, Opportunity, **Inventory Unit**, Bid, Bid Preference, Booking, Payment, Review, Message, Verification, Document, Performance Data, Admin Action.

## Ownership & hierarchy
- Organization owns/operates Venues, Events, Opportunities, Inventory Units, Bids, Bookings.
- Venue → Venue Zones → unit pins / floorplan coords.
- Opportunity packages one or many Inventory Units.
- Bid targets an Inventory Unit, an Opportunity, or ranked preferences (`bid_preferences`).
- Booking = accepted + paid Bid locking one Inventory Unit for a time window.
- Review = post-booking reputation record from one Organization to another.
- Verification = operator-reviewed trust record for an organization, role profile, venue, opportunity, inventory unit, document, or user.
- Document = evidence artifact owned by an Organization and optionally linked to a marketplace object.
- Admin Action = operator audit event against a target object.
- Performance Data is first-class from day one (the moat).

## Trust and reputation contracts
- `organizations.verification_status` is the organization-level summary state.
- `role_profiles.verification_status` and `venues.verification_status` let role and supply pages explain trust state without inventing badges.
- `verifications` stores subject-level review requests and decisions. O4 still governs exact pass/fail criteria; until it is locked, UI must describe state as operational readiness, not a public guarantee.
- `reviews.rating` and sub-ratings are `numeric` because they are scores, not money. D020 still applies to all `*_cents` monetary columns.
- `reviews.status` supports moderation: `requested`, `submitted`, `flagged`, `published`, `hidden`.

## Enum dictionary
Defined in `0002_enums.sql`. Highlights:
- `inventory_unit_type`: vendor_space, sponsor_asset, service_slot, advertising_placement, temporary_real_estate
- `commerce_layer`: physical_sales, lead_generation, brand_exposure, experience_activation, operational_service
- `pricing_mode`: fixed, minimum_bid, competitive_bid, hybrid
- `bid_status`: draft → submitted → viewed → shortlisted → countered → accepted/rejected/waitlisted → payment_pending → paid → booked → completed → reviewed (+ expired, withdrawn)
- `booking_status`: pending_payment → confirmed → upcoming → in_progress → completed (+ cancelled, disputed, reviewed)
- `payment_status`: pending → authorized → paid → paid_out (+ failed, refunded, partially_refunded, disputed)
- `verification_status`: not_started → pending → verified/rejected/expired/revoked
- `review_status`: requested → submitted → flagged → published/hidden

## Spatial precision levels (D006)
1. Venue-level point  2. Zone polygon/centroid  3. Unit pin  4. Floorplan X/Y. Stored as PostGIS `geography` / numeric coords.
