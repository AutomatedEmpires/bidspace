-- 0004_locations.sql — venues, zones, events, collections

create table venues (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  slug text unique,
  venue_type venue_type not null,
  description text,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  state text not null,
  postal_code text,
  country text not null default 'US',
  location geography(Point, 4326) not null,
  boundary geography(Polygon, 4326),
  capacity integer,
  parking_info text,
  power_available boolean,
  water_available boolean,
  wifi_available boolean,
  restroom_info text,
  access_instructions text,
  image_urls jsonb not null default '[]',
  floorplan_urls jsonb not null default '[]',
  status venue_status not null default 'draft',
  verification_status verification_status not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);
create index idx_venues_org on venues (organization_id);
create index idx_venues_location on venues using gist (location);
create index idx_venues_status on venues (status);
create trigger trg_venues_updated before update on venues for each row execute function set_updated_at();

create table venue_zones (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues(id) on delete cascade,
  name text not null,
  zone_type zone_type,
  description text,
  boundary geography(Polygon, 4326),
  center geography(Point, 4326),
  floorplan_x numeric,
  floorplan_y numeric,
  visibility_score numeric,
  traffic_score numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_zones_venue on venue_zones (venue_id);
create index idx_zones_center on venue_zones using gist (center);
create trigger trg_zones_updated before update on venue_zones for each row execute function set_updated_at();

create table events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  venue_id uuid references venues(id),
  name text not null,
  slug text unique,
  event_type event_type not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text,
  estimated_attendance integer,
  attendance_confidence numeric,
  advertising_channels text[] not null default '{}',
  audience_notes text,
  image_urls jsonb not null default '[]',
  status event_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);
create index idx_events_org on events (organization_id);
create index idx_events_venue on events (venue_id);
create index idx_events_dates on events (starts_at, ends_at);
create trigger trg_events_updated before update on events for each row execute function set_updated_at();

create table inventory_collections (
  id uuid primary key default gen_random_uuid(),
  owner_organization_id uuid references organizations(id) on delete set null,
  name text not null,
  slug text unique,
  collection_type collection_type not null,
  description text,
  cover_image_url text,
  region_name text,
  category_focus text[] not null default '{}',
  starts_at timestamptz,
  ends_at timestamptz,
  status collection_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);
create index idx_collections_owner on inventory_collections (owner_organization_id);
create trigger trg_collections_updated before update on inventory_collections for each row execute function set_updated_at();
