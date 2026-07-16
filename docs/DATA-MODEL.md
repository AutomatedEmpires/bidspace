# Data Model

The authoritative schema lives in [`packages/db/migrations`](../packages/db/migrations). This doc is the map.

## Core objects
User, Organization, Organization Membership, Role Profile, Venue, Venue Zone, Event, Inventory Collection, Opportunity, **Inventory Unit / Space**, Bid, **Application**, Invitation, Message Thread, Bid Preference, dormant Booking/Payment records, Review, Verification, Document, Performance Data, Admin Action.

## Ownership & hierarchy
- Organization owns/operates Venues, Events, Opportunities, Inventory Units, Bids, Bookings.
- Venue → Venue Zones → unit pins / floorplan coords.
- Opportunity packages one or many Inventory Units.
- Bid targets an Inventory Unit, an Opportunity, or ranked preferences (`bid_preferences`).
- Booking = accepted + paid Bid locking one Inventory Unit for a time window.
- Performance Data is first-class from day one (the moat).
- Opportunity `allocation_mode` selects bid, application, invite-only, fixed-fee, host-approval, or waitlist intake.
- Applications are amount-free and carry pitch, setup, space, power, and water needs through a host-curated review status.
- Role profile `profile_details` holds vendor setup, utility, service-area, availability, prior-event, social-link, and reusable host-pitch fields.
- FeePlan remains a typed dormant/test concept; no live fee or payment row is created by the founder-preview flow.

## Enum dictionary
Defined in `0002_enums.sql`. Highlights:
- `inventory_unit_type`: vendor_space, sponsor_asset, service_slot, advertising_placement, temporary_real_estate
- `commerce_layer`: physical_sales, lead_generation, brand_exposure, experience_activation, operational_service
- `pricing_mode`: fixed, minimum_bid, competitive_bid, hybrid
- `bid_status`: draft → submitted → viewed → shortlisted → countered → accepted/rejected/waitlisted → payment_pending → paid → booked → completed → reviewed (+ expired, withdrawn)
- `booking_status`: pending_payment → confirmed → upcoming → in_progress → completed (+ cancelled, disputed, reviewed)
- `payment_status`: pending → authorized → paid → paid_out (+ failed, refunded, partially_refunded, disputed)

## Spatial precision levels (D006)
1. Venue-level point  2. Zone polygon/centroid  3. Unit pin  4. Floorplan X/Y. Stored as PostGIS `geography` / numeric coords.
