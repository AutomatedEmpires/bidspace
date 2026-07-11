-- 0009_network.sql — opportunity visibility, private vendor networks, saved
-- opportunities, opportunity invitations, Stripe webhook idempotency.
--
-- Private network + open marketplace is the cold-start strategy: hosts operate
-- with vendors they already know first, then expand visibility. Private and
-- public flows share the same canonical objects — visibility is a property of
-- the opportunity, never a separate product.

create type opportunity_visibility as enum ('public', 'network', 'invite_only');
create type network_member_status as enum ('invited', 'active', 'declined', 'removed');
create type invitation_status as enum ('sent', 'viewed', 'accepted', 'declined');

alter table opportunities
  add column visibility opportunity_visibility not null default 'public';
create index idx_opportunities_visibility on opportunities (visibility);

-- A host's standing commercial relationships. Rows persist across events and
-- seasons; this is the compounding asset of the platform.
create table vendor_network_members (
  id uuid primary key default gen_random_uuid(),
  host_organization_id uuid not null references organizations(id) on delete cascade,
  vendor_organization_id uuid not null references organizations(id) on delete cascade,
  status network_member_status not null default 'invited',
  invited_by_user_id uuid references users(id),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (host_organization_id, vendor_organization_id),
  check (host_organization_id <> vendor_organization_id)
);
create index idx_network_host on vendor_network_members (host_organization_id);
create index idx_network_vendor on vendor_network_members (vendor_organization_id);
create trigger trg_network_updated before update on vendor_network_members
  for each row execute function set_updated_at();

-- Vendor-side shortlist of opportunities worth pursuing.
create table saved_opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  saved_by_user_id uuid references users(id),
  created_at timestamptz not null default now(),
  unique (organization_id, opportunity_id)
);
create index idx_saved_org on saved_opportunities (organization_id);
create index idx_saved_opportunity on saved_opportunities (opportunity_id);

-- Direct invitations to a specific opportunity (the "direct offer" and
-- "invitation only" allocation modes).
create table opportunity_invitations (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  vendor_organization_id uuid not null references organizations(id) on delete cascade,
  invited_by_user_id uuid references users(id),
  message text,
  status invitation_status not null default 'sent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (opportunity_id, vendor_organization_id)
);
create index idx_invitations_opportunity on opportunity_invitations (opportunity_id);
create index idx_invitations_vendor on opportunity_invitations (vendor_organization_id);
create trigger trg_invitations_updated before update on opportunity_invitations
  for each row execute function set_updated_at();

-- Stripe webhook idempotency ledger: the event id is the primary key, so a
-- replayed delivery inserts nothing and the handler can exit early.
create table stripe_webhook_events (
  id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);
