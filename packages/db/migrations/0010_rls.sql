-- 0010_rls.sql — row-level security posture.
--
-- The web app talks to Postgres exclusively through the service-role key from
-- server code (apps/web/lib/bidspace-server.ts); authorization is enforced in
-- the service/action layer against the Clerk-derived organization context.
-- Enabling RLS with no policies makes that posture explicit at the database:
-- anon and authenticated API keys can read/write NOTHING. The service role
-- bypasses RLS by design.
--
-- If a browser-side Supabase client is ever introduced, per-table policies
-- must be written here first — additive migrations, never weakened defaults.

alter table users enable row level security;
alter table organizations enable row level security;
alter table organization_memberships enable row level security;
alter table role_profiles enable row level security;
alter table venues enable row level security;
alter table venue_zones enable row level security;
alter table events enable row level security;
alter table inventory_collections enable row level security;
alter table opportunities enable row level security;
alter table inventory_units enable row level security;
alter table bids enable row level security;
alter table bid_preferences enable row level security;
alter table bookings enable row level security;
alter table payments enable row level security;
alter table message_threads enable row level security;
alter table messages enable row level security;
alter table reviews enable row level security;
alter table documents enable row level security;
alter table verifications enable row level security;
alter table performance_data enable row level security;
alter table admin_actions enable row level security;
alter table vendor_network_members enable row level security;
alter table saved_opportunities enable row level security;
alter table opportunity_invitations enable row level security;
alter table stripe_webhook_events enable row level security;
