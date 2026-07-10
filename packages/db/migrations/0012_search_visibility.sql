-- 0012_search_visibility.sql — plug a private-supply leak in public discovery.
--
-- The spatial discovery RPCs (0008) filtered units by status but NOT by their
-- opportunity's visibility, so a unit belonging to a network/invite-only
-- opportunity surfaced on the PUBLIC, unauthenticated map + viewport API. This
-- is the discovery-layer twin of the unit-page/bid visibility guard added in
-- app code. Redefine both functions to return only units whose opportunity is
-- public AND live. (search_path is re-pinned per 0011.)

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
set search_path = public
as $$
  select
    u.id, u.opportunity_id, u.organization_id, u.name, u.type, u.status,
    u.commerce_layer, u.minimum_bid_cents,
    st_x(u.location::geometry) as longitude,
    st_y(u.location::geometry) as latitude,
    st_distance(u.location, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography) as distance_m
  from inventory_units u
  where u.location is not null
    and u.archived_at is null
    and u.status in ('available', 'receiving_bids', 'shortlisted')
    and exists (
      select 1 from opportunities o
      where o.id = u.opportunity_id
        and o.visibility = 'public'
        and o.status in ('published', 'receiving_bids')
        and o.archived_at is null
    )
    and st_dwithin(u.location, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography, p_radius_m)
    and (p_type is null or u.type = p_type)
    and (p_commerce_layer is null or u.commerce_layer = p_commerce_layer)
  order by distance_m asc
  limit greatest(1, least(p_limit, 1000));
$$;

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
set search_path = public
as $$
  select
    u.id, u.opportunity_id, u.organization_id, u.name, u.type, u.status,
    u.commerce_layer, u.minimum_bid_cents,
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
    and exists (
      select 1 from opportunities o
      where o.id = u.opportunity_id
        and o.visibility = 'public'
        and o.status in ('published', 'receiving_bids')
        and o.archived_at is null
    )
    and st_intersects(
      u.location::geometry,
      st_makeenvelope(p_min_lng, p_min_lat, p_max_lng, p_max_lat, 4326)
    )
    and (p_type is null or u.type = p_type)
    and (p_commerce_layer is null or u.commerce_layer = p_commerce_layer)
  order by distance_m asc
  limit greatest(1, least(p_limit, 2000));
$$;
