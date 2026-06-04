-- 0006_transactions.sql — bids, bid preferences, bookings, payments
-- Money is stored in integer cents (bigint) per D020 (see docs/DECISIONS.md).

create table bids (
  id uuid primary key default gen_random_uuid(),
  bidder_organization_id uuid not null references organizations(id) on delete cascade,
  host_organization_id uuid references organizations(id),
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  inventory_unit_id uuid references inventory_units(id),
  amount_cents bigint not null,
  status bid_status not null default 'draft',
  commerce_layer commerce_layer,
  intended_use text,
  setup_description text,
  category text,
  power_needs boolean,
  water_needs boolean,
  notes text,
  attachments jsonb not null default '[]',
  expires_at timestamptz,
  counter_amount_cents bigint,
  created_by_user_id uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_bids_bidder on bids (bidder_organization_id);
create index idx_bids_opportunity on bids (opportunity_id);
create index idx_bids_unit on bids (inventory_unit_id);
create index idx_bids_status on bids (status);
create trigger trg_bids_updated before update on bids for each row execute function set_updated_at();

create table bid_preferences (
  id uuid primary key default gen_random_uuid(),
  bid_id uuid not null references bids(id) on delete cascade,
  inventory_unit_id uuid references inventory_units(id),
  rank integer not null,
  amount_cents bigint,
  criteria jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index idx_bid_prefs_bid on bid_preferences (bid_id);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  inventory_unit_id uuid not null references inventory_units(id),
  bid_id uuid not null unique references bids(id),
  host_organization_id uuid not null references organizations(id),
  bidder_organization_id uuid not null references organizations(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  price_cents bigint not null,
  status booking_status not null default 'pending_payment',
  contract_terms text,
  check_in_status text,
  host_notes text,
  bidder_notes text,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_bookings_unit on bookings (inventory_unit_id);
create index idx_bookings_host on bookings (host_organization_id);
create index idx_bookings_bidder on bookings (bidder_organization_id);
create index idx_bookings_status on bookings (status);
create trigger trg_bookings_updated before update on bookings for each row execute function set_updated_at();

create table payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  payer_organization_id uuid references organizations(id),
  payee_organization_id uuid references organizations(id),
  amount_cents bigint not null,
  currency text not null default 'USD',
  platform_fee_cents bigint,
  host_payout_cents bigint,
  refund_cents bigint,
  status payment_status not null default 'pending',
  stripe_payment_intent_id text,
  failure_reason text,
  receipt_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_payments_booking on payments (booking_id);
create index idx_payments_status on payments (status);
create trigger trg_payments_updated before update on payments for each row execute function set_updated_at();
