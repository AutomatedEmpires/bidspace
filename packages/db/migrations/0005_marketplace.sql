-- 0005_marketplace.sql — opportunities, inventory units
-- Money is stored in integer cents (bigint) per D020 (see docs/DECISIONS.md).

create table opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  venue_id uuid references venues(id),
  event_id uuid references events(id),
  collection_id uuid references inventory_collections(id),
  title text not null,
  slug text unique,
  description text,
  commerce_layer commerce_layer,
  pricing_mode pricing_mode not null default 'hybrid',
  starts_at timestamptz,
  ends_at timestamptz,
  location geography(Point, 4326),
  audience_profile text,
  estimated_attendance integer,
  traffic_confidence numeric,
  category_tags text[] not null default '{}',
  minimum_bid_cents bigint,
  bid_deadline timestamptz,
  requirements jsonb not null default '{}',
  image_urls jsonb not null default '[]',
  status opportunity_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);
create index idx_opportunities_org on opportunities (organization_id);
create index idx_opportunities_venue on opportunities (venue_id);
create index idx_opportunities_event on opportunities (event_id);
create index idx_opportunities_status on opportunities (status);
create index idx_opportunities_location on opportunities using gist (location);
create trigger trg_opportunities_updated before update on opportunities for each row execute function set_updated_at();

create table inventory_units (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  venue_id uuid references venues(id),
  event_id uuid references events(id),
  zone_id uuid references venue_zones(id),
  collection_id uuid references inventory_collections(id),
  type inventory_unit_type not null,
  name text not null,
  commerce_layer commerce_layer,
  availability_start timestamptz not null,
  availability_end timestamptz not null,
  status inventory_unit_status not null default 'draft',
  pricing_mode pricing_mode not null default 'hybrid',
  location geography(Point, 4326),
  floorplan_x numeric,
  floorplan_y numeric,
  dimensions text,
  indoor boolean,
  power_available boolean,
  water_available boolean,
  wifi_available boolean,
  vehicle_access boolean,
  setup_window text,
  teardown_window text,
  required_documents text[] not null default '{}',
  category_restrictions text[] not null default '{}',
  outcome_tags text[] not null default '{}',
  minimum_bid_cents bigint,
  buy_now_price_cents bigint,
  reserve_price_cents bigint,
  visibility_score numeric,
  traffic_score numeric,
  notes text,
  image_urls jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);
create index idx_units_opportunity on inventory_units (opportunity_id);
create index idx_units_org on inventory_units (organization_id);
create index idx_units_zone on inventory_units (zone_id);
create index idx_units_status on inventory_units (status);
create index idx_units_type on inventory_units (type);
create index idx_units_location on inventory_units using gist (location);
create trigger trg_units_updated before update on inventory_units for each row execute function set_updated_at();
