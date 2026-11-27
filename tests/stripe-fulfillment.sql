-- Run only against an empty disposable PostgreSQL database with psql -v ON_ERROR_STOP=1.
do $$ begin
 if not exists (select from pg_roles where rolname = 'anon') then create role anon; end if;
 if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
 if not exists (select from pg_roles where rolname = 'service_role') then create role service_role; end if;
end $$;
create table profiles (id uuid primary key, stripe_customer_id text, ocean_sentinel_premium boolean, ocean_sentinel_premium_until timestamptz, subscription_tier text, subscription_status text, account_type text, listing_slots_included int, verified_retailer boolean, listing_slots_extra int default 0);
create table stripe_events (event_id text primary key, type text);
create table slot_purchases (user_id uuid references profiles, slots_qty int, amount_aed numeric, payment_ref text);
create table listings (id uuid primary key, is_boosted boolean, boosted_until timestamptz);
create table boost_purchases (user_id uuid references profiles, listing_id uuid references listings, amount_aed numeric, duration_days int, boosted_from timestamptz, payment_ref text);
create table ad_banner_bids (id uuid primary key, status text, stripe_payment_intent_id text, stripe_capture_status text);
create function apply_slot_purchase() returns trigger language plpgsql as $$ begin
 update profiles set listing_slots_extra = listing_slots_extra + new.slots_qty where id = new.user_id;
 return new;
end $$;
create trigger slot_apply after insert on slot_purchases for each row execute function apply_slot_purchase();
\ir ../supabase/migrations/20261126000000_atomic_stripe_fulfillment.sql
insert into profiles(id) values ('00000000-0000-0000-0000-000000000001');
-- Inject a failure AFTER fulfillment writes, proving the event and benefits roll back together.
create function fail_slot() returns trigger language plpgsql as $$ begin raise exception 'injected failure'; end $$;
create trigger zz_fail after insert on slot_purchases for each row execute function fail_slot();
do $$ begin
 begin
  perform fulfill_stripe_event('evt_retry', 'checkout.session.completed', '{"customer":"cus_test","metadata":{"userId":"00000000-0000-0000-0000-000000000001","type":"slots","qty":"3"}}');
  raise exception 'expected injected failure';
 exception when others then
  if sqlerrm <> 'injected failure' then raise; end if;
 end;
 assert (select count(*) = 0 from stripe_events);
 assert (select count(*) = 0 from slot_purchases);
 assert (select listing_slots_extra = 0 and stripe_customer_id is null from profiles);
end $$;
drop trigger zz_fail on slot_purchases;
do $$ declare result jsonb; begin
 result := fulfill_stripe_event('evt_retry', 'checkout.session.completed', '{"metadata":{"userId":"00000000-0000-0000-0000-000000000001","type":"slots","qty":"3"}}');
 assert result->>'duplicate' = 'false';
 result := fulfill_stripe_event('evt_retry', 'checkout.session.completed', '{"metadata":{"userId":"00000000-0000-0000-0000-000000000001","type":"slots","qty":"3"}}');
 assert result->>'duplicate' = 'true';
 assert (select count(*) = 1 from slot_purchases);
 assert (select listing_slots_extra = 3 from profiles);
 assert not has_function_privilege('anon', 'fulfill_stripe_event(text,text,jsonb)', 'execute');
 assert not has_function_privilege('authenticated', 'fulfill_stripe_event(text,text,jsonb)', 'execute');
 assert has_function_privilege('service_role', 'fulfill_stripe_event(text,text,jsonb)', 'execute');
end $$;
-- Exercise each remaining fulfillment branch against the same fixture schema.
insert into listings(id) values ('00000000-0000-0000-0000-000000000002');
insert into ad_banner_bids(id, status) values ('00000000-0000-0000-0000-000000000003', 'draft');
do $$ declare result jsonb; metadata jsonb := '{"userId":"00000000-0000-0000-0000-000000000001"}'; begin
 perform fulfill_stripe_event('evt_boost', 'checkout.session.completed', jsonb_build_object('metadata', metadata || '{"type":"boost","listingId":"00000000-0000-0000-0000-000000000002"}'::jsonb));
 assert (select is_boosted and boosted_until > now() from listings);
 assert (select count(*) = 1 from boost_purchases);
 result := fulfill_stripe_event('evt_banner', 'checkout.session.completed', jsonb_build_object('metadata', metadata || '{"type":"banner_bid","bidId":"00000000-0000-0000-0000-000000000003"}'::jsonb));
 assert result->>'bid_id' = '00000000-0000-0000-0000-000000000003';
 assert (select status = 'pending_approval' from ad_banner_bids);
 perform fulfill_stripe_event('evt_pro', 'checkout.session.completed', jsonb_build_object('metadata', metadata || '{"type":"pro"}'::jsonb));
 assert (select subscription_tier = 'pro' and listing_slots_included = 50 from profiles);
 perform fulfill_stripe_event('evt_business', 'customer.subscription.updated', jsonb_build_object('status', 'active', 'metadata', metadata || '{"type":"business"}'::jsonb));
 assert (select subscription_tier = 'business' and listing_slots_included = 999999 from profiles);
 perform fulfill_stripe_event('evt_cancel', 'customer.subscription.deleted', jsonb_build_object('metadata', metadata || '{"type":"business"}'::jsonb));
 assert (select subscription_tier = 'free' and not verified_retailer from profiles);
 perform fulfill_stripe_event('evt_ocean', 'checkout.session.completed', jsonb_build_object('metadata', metadata || '{"type":"ocean_sentinel"}'::jsonb));
 assert (select ocean_sentinel_premium from profiles);
 perform fulfill_stripe_event('evt_ocean_cancel', 'customer.subscription.deleted', jsonb_build_object('metadata', metadata || '{"type":"ocean_sentinel"}'::jsonb));
 assert (select not ocean_sentinel_premium from profiles);
end $$;
