-- 0008_search.sql — spatial discovery RPCs (Phase 5)
-- Map-first, card-first discovery (D009). Returns *available* inventory units
-- near a point (radius) or within a map viewport (bbox), ordered by distance.
-- Money returned in integer cents (D020). Coordinates are GeoJSON order [lng, lat].

-- Radius search: all available units within p_radius_m metres of (p_lat, p_lng).
create or replace function search_inventory_units(
  p_lat double precision,
  p_lng double precision,
  p_radius_m double precision default 50000,
  p_type inventory_unit_type default null,
  p_commerce_layer commerce_layer default null,
  p_limit integer default 100
)
returns table (
  id uuid,
  opportunity_id uuid,
  organization_id uuid,
  name text,
  type inventory_unit_type,
  status inventory_unit_status,
  commerce_layer commerce_layer,
  minimum_bid_cents bigint,
  longitude double precision,
  latitude double precision,
  distance_m double precision
)
language sql
stable
as $$
  select
    u.id,
    u.opportunity_id,
    u.organization_id,
    u.name,
    u.type,
    u.status,
    u.commerce_layer,
    u.minimum_bid_cents,
    st_x(u.location::geometry) as longitude,
    st_y(u.location::geometry) as latitude,
    st_distance(
      u.location,
      st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography
    ) as distance_m
  from inventory_units u
  where u.location is not null
    and u.archived_at is null
    and u.status in ('available', 'receiving_bids', 'shortlisted')
    and st_dwithin(
      u.location,
      st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography,
      p_radius_m
    )
    and (p_type is null or u.type = p_type)
    and (p_commerce_layer is null or u.commerce_layer = p_commerce_layer)
  order by distance_m asc
  limit greatest(1, least(p_limit, 1000));
$$;

-- Viewport search: all available units inside the map bounding box, ordered by
-- distance from the viewport centre (good for clustering / list pairing).
create or replace function search_inventory_units_in_bbox(
  p_min_lng double precision,
  p_min_lat double precision,
  p_max_lng double precision,
  p_max_lat double precision,
  p_type inventory_unit_type default null,
  p_commerce_layer commerce_layer default null,
  p_limit integer default 500
)
returns table (
  id uuid,
  opportunity_id uuid,
  organization_id uuid,
  name text,
  type inventory_unit_type,
  status inventory_unit_status,
  commerce_layer commerce_layer,
  minimum_bid_cents bigint,
  longitude double precision,
  latitude double precision,
  distance_m double precision
)
language sql
stable
as $$
  select
    u.id,
    u.opportunity_id,
    u.organization_id,
    u.name,
    u.type,
    u.status,
    u.commerce_layer,
    u.minimum_bid_cents,
    st_x(u.location::geometry) as longitude,
    st_y(u.location::geometry) as latitude,
    st_distance(
      u.location,
      st_centroid(st_makeenvelope(p_min_lng, p_min_lat, p_max_lng, p_max_lat, 4326))::geography
    ) as distance_m
  from inventory_units u
  where u.location is not null
    and u.archived_at is null
    and u.status in ('available', 'receiving_bids', 'shortlisted')
    and st_intersects(
      u.location::geometry,
      st_makeenvelope(p_min_lng, p_min_lat, p_max_lng, p_max_lat, 4326)
    )
    and (p_type is null or u.type = p_type)
    and (p_commerce_layer is null or u.commerce_layer = p_commerce_layer)
  order by distance_m asc
  limit greatest(1, least(p_limit, 2000));
$$;
