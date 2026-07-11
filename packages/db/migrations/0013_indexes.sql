-- 0013_indexes.sql — indexes for hot query paths missed by earlier migrations.
--
-- 1. bids.host_organization_id — listBidsForHostOrg (the host bid-review
--    pipeline + command center) filters on it every load; 0006 indexed bidder,
--    opportunity, unit, and status but not host.
-- 2. payments.stripe_payment_intent_id — findPaymentByStripeIntent runs on
--    every refund/dispute webhook; without this it's a full table scan.

create index if not exists idx_bids_host on bids (host_organization_id);
create index if not exists idx_payments_intent on payments (stripe_payment_intent_id);
