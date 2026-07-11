-- 0011_hardening.sql — advisor-driven hardening (Supabase security lints).
--
-- 1. Pin search_path on our functions (mutable search_path lint).
-- 2. Close PostGIS artifacts off from the anon/authenticated API roles:
--    spatial_ref_sys is reference data and st_estimatedextent is a
--    SECURITY DEFINER helper — neither belongs in the public API surface.
--    Wrapped in exception guards: ownership of extension objects varies by
--    platform version, and hardening must not block a deploy.

alter function public.set_updated_at() set search_path = public;
alter function public.search_inventory_units(
  double precision, double precision, double precision,
  inventory_unit_type, commerce_layer, integer
) set search_path = public;
alter function public.search_inventory_units_in_bbox(
  double precision, double precision, double precision, double precision,
  inventory_unit_type, commerce_layer, integer
) set search_path = public;

do $$
begin
  revoke select on table public.spatial_ref_sys from anon, authenticated;
exception when insufficient_privilege then
  raise notice 'spatial_ref_sys revoke skipped (not owner)';
end $$;

do $$
begin
  revoke execute on function public.st_estimatedextent(text, text) from anon, authenticated;
  revoke execute on function public.st_estimatedextent(text, text, text) from anon, authenticated;
  revoke execute on function public.st_estimatedextent(text, text, text, boolean) from anon, authenticated;
exception when insufficient_privilege or undefined_function then
  raise notice 'st_estimatedextent revoke skipped';
end $$;
