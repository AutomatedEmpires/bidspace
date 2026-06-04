-- 0001_extensions.sql — required extensions and shared helpers

create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists postgis;     -- geography/geometry spatial types
create extension if not exists citext;      -- case-insensitive email

-- Shared trigger to maintain updated_at.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
