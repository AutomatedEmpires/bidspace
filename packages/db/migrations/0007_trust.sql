-- 0007_trust.sql — messaging, reviews, documents, verifications, performance, admin

create table message_threads (
  id uuid primary key default gen_random_uuid(),
  context message_thread_context not null,
  bid_id uuid references bids(id) on delete cascade,
  booking_id uuid references bookings(id) on delete cascade,
  opportunity_id uuid references opportunities(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index idx_threads_bid on message_threads (bid_id);
create index idx_threads_booking on message_threads (booking_id);

create table messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references message_threads(id) on delete cascade,
  sender_user_id uuid references users(id),
  sender_organization_id uuid references organizations(id),
  body text not null,
  attachments jsonb not null default '[]',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_messages_thread on messages (thread_id);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  reviewer_organization_id uuid not null references organizations(id),
  reviewed_organization_id uuid not null references organizations(id),
  rating numeric not null,
  traffic_accuracy_rating numeric,
  communication_rating numeric,
  setup_rating numeric,
  professionalism_rating numeric,
  written_feedback text,
  would_book_again boolean,
  actual_traffic_feedback text,
  photo_urls jsonb not null default '[]',
  status review_status not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_reviews_booking on reviews (booking_id);
create index idx_reviews_reviewed on reviews (reviewed_organization_id);
create trigger trg_reviews_updated before update on reviews for each row execute function set_updated_at();

create table documents (
  id uuid primary key default gen_random_uuid(),
  owner_organization_id uuid not null references organizations(id) on delete cascade,
  file_url text not null,
  document_type document_type not null,
  status document_status not null default 'uploaded',
  linked_object_type text,
  linked_object_id uuid,
  expiration_date date,
  uploaded_by_user_id uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_documents_owner on documents (owner_organization_id);
create trigger trg_documents_updated before update on documents for each row execute function set_updated_at();

create table verifications (
  id uuid primary key default gen_random_uuid(),
  subject_type verification_subject_type not null,
  subject_id uuid not null,
  verification_type verification_type not null,
  status verification_status not null default 'pending',
  reviewer_user_id uuid references users(id),
  evidence_document_ids uuid[] not null default '{}',
  expires_at timestamptz,
  risk_score numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_verifications_subject on verifications (subject_type, subject_id);
create index idx_verifications_status on verifications (status);
create trigger trg_verifications_updated before update on verifications for each row execute function set_updated_at();

create table performance_data (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete set null,
  inventory_unit_id uuid references inventory_units(id) on delete set null,
  opportunity_id uuid references opportunities(id) on delete set null,
  venue_id uuid references venues(id) on delete set null,
  host_organization_id uuid references organizations(id),
  bidder_organization_id uuid references organizations(id),
  metric_key text not null,
  metric_value numeric,
  metric_text text,
  source performance_metric_source,
  category text,
  created_at timestamptz not null default now()
);
create index idx_perf_unit on performance_data (inventory_unit_id);
create index idx_perf_booking on performance_data (booking_id);
create index idx_perf_metric on performance_data (metric_key);

create table admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references users(id),
  action_type admin_action_type not null,
  target_type text,
  target_id uuid,
  notes text,
  created_at timestamptz not null default now()
);
create index idx_admin_actions_admin on admin_actions (admin_user_id);
create index idx_admin_actions_target on admin_actions (target_type, target_id);
