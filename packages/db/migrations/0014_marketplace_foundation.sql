-- 0014_marketplace_foundation.sql — application allocation + richer profiles
--
-- Bidding remains the core allocation method. Applications are a separate,
-- amount-free submission so BidSpace never invents a token $0.01 bid merely
-- to fit a bidding table. Payment and fee plans remain dormant.

create type allocation_mode as enum (
  'bid',
  'application',
  'invite_only',
  'fixed_fee',
  'host_approval',
  'waitlist'
);

create type application_status as enum (
  'draft',
  'invited',
  'submitted',
  'under_review',
  'shortlisted',
  'approved',
  'declined',
  'waitlisted',
  'withdrawn',
  'expired'
);

alter table opportunities
  add column allocation_mode allocation_mode not null default 'bid';
create index idx_opportunities_allocation_mode on opportunities (allocation_mode);

alter table role_profiles
  add column profile_details jsonb not null default '{}';

create table applications (
  id uuid primary key default gen_random_uuid(),
  vendor_organization_id uuid not null references organizations(id) on delete cascade,
  host_organization_id uuid not null references organizations(id) on delete cascade,
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  inventory_unit_id uuid references inventory_units(id) on delete set null,
  pitch text not null,
  setup_description text,
  space_needs text,
  category text,
  power_needs boolean,
  water_needs boolean,
  attachments jsonb not null default '[]',
  status application_status not null default 'submitted',
  created_by_user_id uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (vendor_organization_id, opportunity_id, inventory_unit_id)
);
create index idx_applications_vendor on applications (vendor_organization_id);
create index idx_applications_host on applications (host_organization_id);
create index idx_applications_opportunity on applications (opportunity_id);
create index idx_applications_status on applications (status);
create trigger trg_applications_updated before update on applications
  for each row execute function set_updated_at();

-- D025: browser clients receive no access. Server-side service-role requests
-- bypass RLS and enforce organization authorization in the action layer.
alter table applications enable row level security;

alter type message_thread_context add value if not exists 'application';
alter table message_threads
  add column application_id uuid references applications(id) on delete cascade;
create index idx_threads_application on message_threads (application_id);
