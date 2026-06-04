-- 0003_identity.sql — users, organizations, memberships, role profiles

create table users (
  id uuid primary key default gen_random_uuid(),
  auth_provider_id text unique,
  email citext unique not null,
  phone text,
  full_name text not null,
  avatar_url text,
  status user_status not null default 'active',
  timezone text,
  notification_preferences jsonb not null default '{}',
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_users_status on users (status);
create trigger trg_users_updated before update on users for each row execute function set_updated_at();

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  organization_type organization_type not null,
  description text,
  logo_url text,
  website_url text,
  phone text,
  email citext,
  address_line_1 text,
  address_line_2 text,
  city text,
  state text,
  postal_code text,
  country text not null default 'US',
  location geography(Point, 4326),
  status organization_status not null default 'draft',
  verification_status verification_status not null default 'not_started',
  stripe_account_id text,
  created_by_user_id uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);
create index idx_orgs_type on organizations (organization_type);
create index idx_orgs_status on organizations (status);
create index idx_orgs_location on organizations using gist (location);
create trigger trg_orgs_updated before update on organizations for each row execute function set_updated_at();

create table organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role organization_member_role not null default 'member',
  status membership_status not null default 'active',
  invited_by_user_id uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);
create index idx_memberships_user on organization_memberships (user_id);
create trigger trg_memberships_updated before update on organization_memberships for each row execute function set_updated_at();

create table role_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  role_type marketplace_role_type not null,
  display_name text not null,
  slug text unique,
  bio text,
  gallery_urls jsonb not null default '[]',
  category_tags text[] not null default '{}',
  commerce_layers text[] not null default '{}',
  service_radius_miles integer,
  public_contact_enabled boolean not null default false,
  status role_profile_status not null default 'draft',
  verification_status verification_status not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (organization_id, role_type)
);
create index idx_role_profiles_org on role_profiles (organization_id);
create trigger trg_role_profiles_updated before update on role_profiles for each row execute function set_updated_at();
