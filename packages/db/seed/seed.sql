-- BidSpace demo seed — Inland Northwest launch region.
-- Idempotent-ish: run once against a fresh database (after migrations 0001–0010).
-- Deterministic UUIDs so app links are stable across reseeds.
--
--   psql "$DATABASE_URL" -f packages/db/seed/seed.sql

begin;

-- ---------- Users ----------
insert into users (id, email, full_name, status) values
  ('00000000-0000-4000-8000-000000000001', 'maria@spokanefair.example.com', 'Maria Delgado', 'active'),
  ('00000000-0000-4000-8000-000000000002', 'sam@kendallmarket.example.com', 'Sam Whitfield', 'active'),
  ('00000000-0000-4000-8000-000000000003', 'lena@lenastacos.example.com', 'Lena Ortiz', 'active'),
  ('00000000-0000-4000-8000-000000000004', 'jon@pinecrafted.example.com', 'Jon Beck', 'active')
on conflict (id) do nothing;

-- ---------- Organizations ----------
insert into organizations (id, name, legal_name, organization_type, description, city, state, country, location, status, verification_status, created_by_user_id) values
  ('10000000-0000-4000-8000-000000000001', 'Spokane Interstate Fair', 'Spokane County Fair & Expo LLC',
   'host', 'Operator of the Spokane County Fair & Expo Center — 10 days, 200k visitors, year-round vendor grounds.',
   'Spokane Valley', 'WA', 'US', st_setsrid(st_makepoint(-117.2827, 47.6588), 4326)::geography,
   'active', 'verified', '00000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000002', 'Kendall Yards Night Market', 'Kendall Market Collective',
   'host', 'Wednesday night market on the Centennial Trail overlooking the Spokane River gorge.',
   'Spokane', 'WA', 'US', st_setsrid(st_makepoint(-117.4324, 47.6647), 4326)::geography,
   'active', 'verified', '00000000-0000-4000-8000-000000000002'),
  ('20000000-0000-4000-8000-000000000001', 'Lena''s Tacos', 'Lena''s Tacos LLC',
   'bidder', 'Family-run taco truck — birria, al pastor, and a line that never quits.',
   'Spokane', 'WA', 'US', st_setsrid(st_makepoint(-117.41, 47.66), 4326)::geography,
   'active', 'verified', '00000000-0000-4000-8000-000000000003'),
  ('20000000-0000-4000-8000-000000000002', 'Pinecrafted Goods', 'Pinecrafted Goods LLC',
   'bidder', 'Hand-turned woodware and Inland Northwest gifts. 10x10 booth with custom cedar fixtures.',
   'Coeur d''Alene', 'ID', 'US', st_setsrid(st_makepoint(-116.7805, 47.6777), 4326)::geography,
   'active', 'pending', '00000000-0000-4000-8000-000000000004')
on conflict (id) do nothing;

-- ---------- Memberships ----------
insert into organization_memberships (organization_id, user_id, role, status) values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'owner', 'active'),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', 'owner', 'active'),
  ('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000003', 'owner', 'active'),
  ('20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000004', 'owner', 'active')
on conflict (organization_id, user_id) do nothing;

-- ---------- Role profiles ----------
insert into role_profiles (id, organization_id, role_type, display_name, slug, bio, category_tags, status, verification_status, gallery_urls) values
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'host',
   'Spokane Interstate Fair', 'spokane-interstate-fair',
   'Fairgrounds, expo halls, and outdoor vendor rows across 97 acres.', '{}', 'active', 'verified', '[]'),
  ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'host',
   'Kendall Yards Night Market', 'kendall-yards-night-market',
   'Curated weekly market — 60 vendor stalls, live music, river views.', '{}', 'active', 'verified', '[]'),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', 'bidder',
   'Lena''s Tacos', 'lenas-tacos',
   'Birria, al pastor, agua frescas. Self-contained 24ft truck, 50A power preferred.',
   '{food}', 'active', 'verified', '[]'),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000002', 'bidder',
   'Pinecrafted Goods', 'pinecrafted-goods',
   'Hand-turned bowls, boards, and small-batch cedar goods.',
   '{retail,makers}', 'active', 'not_started', '[]')
on conflict (id) do nothing;

-- ---------- Venues ----------
insert into venues (id, organization_id, name, slug, venue_type, description, address_line_1, city, state, postal_code, country, location, capacity, power_available, water_available, status, verification_status, parking_info, access_instructions) values
  ('40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001',
   'Spokane County Fair & Expo Center', 'spokane-fair-expo', 'fairgrounds',
   'Ten-day county fair plus year-round events. Paved vendor rows, expo halls, grandstand.',
   '404 N Havana St', 'Spokane Valley', 'WA', '99202', 'US',
   st_setsrid(st_makepoint(-117.2827, 47.6588), 4326)::geography,
   200000, true, true, 'active', 'verified',
   'Vendor parking in Lot C with wristband.', 'Gate 4 load-in, 6:00–8:30am daily. Site office: Blue Building.'),
  ('40000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002',
   'Kendall Yards — Summit Parkway', 'kendall-yards-summit-parkway', 'outdoor',
   'Closed-street market site along Summit Parkway with river gorge views.',
   '1335 W Summit Pkwy', 'Spokane', 'WA', '99201', 'US',
   st_setsrid(st_makepoint(-117.4324, 47.6647), 4326)::geography,
   8000, true, false, 'active', 'verified',
   'Street parking after 4pm; vendor vehicles off-street by 4:30.', 'Check in at the info tent, west end.')
on conflict (id) do nothing;

-- ---------- Events ----------
insert into events (id, organization_id, venue_id, name, slug, event_type, description, starts_at, ends_at, estimated_attendance, status) values
  ('50000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001',
   'Spokane Interstate Fair 2026', 'spokane-interstate-fair-2026', 'fair',
   'The Inland Northwest''s biggest ten days: rides, rodeo, concerts, and 200k+ visitors.',
   '2026-09-11T17:00:00Z', '2026-09-20T23:00:00Z', 205000, 'published'),
  ('50000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002',
   'Night Market — August Series', 'kendall-night-market-august-2026', 'market',
   'Four Wednesday evenings in August. 60 stalls, live music, 2–3k visitors per night.',
   '2026-08-05T23:00:00Z', '2026-08-27T04:00:00Z', 11000, 'published')
on conflict (id) do nothing;

-- ---------- Opportunities ----------
insert into opportunities (id, organization_id, venue_id, event_id, title, slug, description, status, visibility, pricing_mode, commerce_layer, starts_at, ends_at, location, audience_profile, estimated_attendance, category_tags, minimum_bid_cents, bid_deadline) values
  ('60000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001',
   '40000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001',
   'Interstate Fair 2026 — Food Row Positions', 'interstate-fair-2026-food-row-60000000',
   'Ten days of fair traffic on the main food row between the grandstand and the midway. Positions include 50A power and potable water hookups. Health permit and insurance required before load-in.',
   'receiving_bids', 'public', 'competitive_bid', 'physical_sales',
   '2026-09-11T17:00:00Z', '2026-09-20T23:00:00Z',
   st_setsrid(st_makepoint(-117.2827, 47.6588), 4326)::geography,
   'Families and county-wide general audience; heaviest 4–9pm and weekends.',
   205000, '{food,beverage}', 185000, '2026-08-07T07:00:00Z'),
  ('60000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002',
   '40000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000002',
   'August Night Market — Maker Stalls', 'august-night-market-maker-stalls-60000000',
   'Four-night series along Summit Parkway. 10x10 stalls with shared string lighting; tables not provided. Curated maker/retail mix — no direct-sales franchises.',
   'receiving_bids', 'public', 'minimum_bid', 'physical_sales',
   '2026-08-05T23:00:00Z', '2026-08-27T04:00:00Z',
   st_setsrid(st_makepoint(-117.4324, 47.6647), 4326)::geography,
   'Young professionals and families; strong dinner-hour foot traffic.',
   11000, '{retail,makers,food}', 22000, '2026-07-24T07:00:00Z'),
  ('60000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001',
   '40000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001',
   'Interstate Fair 2026 — Grandstand Banner Placements', 'fair-grandstand-banners-60000000',
   'Season-long banner positions facing the grandstand seating bowl (nightly concerts + rodeo). Production to spec; installation included.',
   'published', 'network', 'fixed', 'brand_exposure',
   '2026-09-11T17:00:00Z', '2026-09-20T23:00:00Z',
   st_setsrid(st_makepoint(-117.2820, 47.6592), 4326)::geography,
   'Grandstand events average 6,500/night across 10 nights.',
   65000, '{sponsorship}', 450000, '2026-08-21T07:00:00Z')
on conflict (id) do nothing;

-- ---------- Inventory units ----------
insert into inventory_units (id, opportunity_id, organization_id, venue_id, event_id, type, name, status, pricing_mode, commerce_layer, minimum_bid_cents, buy_now_price_cents, availability_start, availability_end, location, dimensions, indoor, power_available, water_available, vehicle_access, setup_window, required_documents, category_restrictions) values
  ('70000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001',
   'vendor_space', 'Food Row F-01 — Grandstand corner', 'receiving_bids', 'competitive_bid', 'physical_sales',
   225000, null, '2026-09-11T14:00:00Z', '2026-09-20T23:59:00Z',
   st_setsrid(st_makepoint(-117.28305, 47.65873), 4326)::geography,
   '20×20 ft pad', false, true, true, true, 'Sept 10, 8am–6pm',
   '{insurance,food_permit}', '{food}'),
  ('70000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001',
   'vendor_space', 'Food Row F-07 — Midway side', 'receiving_bids', 'competitive_bid', 'physical_sales',
   185000, null, '2026-09-11T14:00:00Z', '2026-09-20T23:59:00Z',
   st_setsrid(st_makepoint(-117.28242, 47.65891), 4326)::geography,
   '16×16 ft pad', false, true, true, true, 'Sept 10, 8am–6pm',
   '{insurance,food_permit}', '{food}'),
  ('70000000-0000-4000-8000-000000000003', '60000000-0000-4000-8000-000000000002',
   '10000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000002',
   'vendor_space', 'Stall 12 — Center block', 'receiving_bids', 'minimum_bid', 'physical_sales',
   22000, 36000, '2026-08-05T21:00:00Z', '2026-08-27T05:00:00Z',
   st_setsrid(st_makepoint(-117.43225, 47.66475), 4326)::geography,
   '10×10 ft stall', false, true, false, false, 'Wednesdays 3–4:30pm',
   '{insurance}', '{}'),
  ('70000000-0000-4000-8000-000000000004', '60000000-0000-4000-8000-000000000002',
   '10000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000002',
   'vendor_space', 'Stall 27 — Trail entrance', 'receiving_bids', 'minimum_bid', 'physical_sales',
   26000, 42000, '2026-08-05T21:00:00Z', '2026-08-27T05:00:00Z',
   st_setsrid(st_makepoint(-117.43312, 47.66462), 4326)::geography,
   '10×10 ft stall', false, false, false, false, 'Wednesdays 3–4:30pm',
   '{insurance}', '{}'),
  ('70000000-0000-4000-8000-000000000005', '60000000-0000-4000-8000-000000000003',
   '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001',
   'sponsor_asset', 'Grandstand Banner — North face 30ft', 'available', 'fixed', 'brand_exposure',
   450000, 450000, '2026-09-11T14:00:00Z', '2026-09-20T23:59:00Z',
   st_setsrid(st_makepoint(-117.28195, 47.65925), 4326)::geography,
   '30×6 ft banner', false, null, null, null, 'Installed by site crew',
   '{}', '{sponsorship}')
on conflict (id) do nothing;

-- ---------- Network + invitations ----------
insert into vendor_network_members (host_organization_id, vendor_organization_id, status, note) values
  ('10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'active', 'Anchor food vendor, 2024–2025 seasons'),
  ('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'invited', 'Recommended by Kendall Yards')
on conflict (host_organization_id, vendor_organization_id) do nothing;

-- ---------- A live bid ----------
insert into bids (id, bidder_organization_id, host_organization_id, opportunity_id, inventory_unit_id, amount_cents, status, commerce_layer, intended_use) values
  ('80000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001',
   '70000000-0000-4000-8000-000000000002', 205000, 'submitted', 'physical_sales',
   'Birria + al pastor truck, self-contained, 24ft. Ran Kendall Yards 2024-25 (avg $2.1k/night). Need 50A; greywater self-managed.')
on conflict (id) do nothing;

-- ---------- Documents ----------
insert into documents (owner_organization_id, file_url, document_type, status, expiration_date) values
  ('20000000-0000-4000-8000-000000000001', 'https://res.cloudinary.com/demo/image/upload/sample.pdf', 'insurance', 'verified', '2027-03-01'),
  ('20000000-0000-4000-8000-000000000001', 'https://res.cloudinary.com/demo/image/upload/sample.pdf', 'food_permit', 'verified', '2026-12-31')
on conflict do nothing;

commit;
