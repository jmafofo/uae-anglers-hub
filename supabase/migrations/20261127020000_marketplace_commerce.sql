-- Transactional commerce. New tables default to no client writes; all money,
-- stock and booking transitions run through service-role-only functions.
begin;
create table public.commerce_merchants (
  user_id uuid primary key references public.profiles(id),
  display_name text not null,
  seller_class text not null default 'individual' check (seller_class in ('individual','dealer')),
  rental_paid_until timestamptz,
  stripe_account_id text unique,
  enabled boolean not null default false,
  shipping_fils integer not null default 0 check (shipping_fils >= 0),
  delivery_days integer check (delivery_days between 1 and 60),
  whatsapp_e164 text check (whatsapp_e164 is null or whatsapp_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  whatsapp_opted_in_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.listings add column if not exists stock_quantity integer not null default 1 check (stock_quantity >= 0);
create table public.charter_departures (
  id uuid primary key default gen_random_uuid(),
  charter_id uuid not null references public.charters(id),
  merchant_id uuid not null references public.commerce_merchants(user_id),
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  price_fils integer not null check (price_fils > 0),
  capacity integer not null check (capacity > 0),
  is_active boolean not null default false,
  unique(charter_id, starts_at)
);
create table public.commerce_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('UA-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
  request_key uuid not null,
  buyer_id uuid not null references public.profiles(id),
  merchant_id uuid not null references public.commerce_merchants(user_id),
  kind text not null check (kind in ('gear','charter')),
  listing_id uuid references public.listings(id),
  departure_id uuid references public.charter_departures(id),
  title text not null,
  image_url text,
  quantity integer not null check (quantity between 1 and 20),
  total_fils integer not null check (total_fils > 0),
  shipping_fils integer not null default 0 check (shipping_fils >= 0),
  seller_class text not null check (seller_class in ('individual','dealer')),
  commission_bps integer not null check (commission_bps in (0,500)),
  commission_fils integer not null check (commission_fils >= 0 and commission_fils <= total_fils),
  currency text not null default 'aed' check (currency = 'aed'),
  stripe_account_id text not null,
  status text not null default 'awaiting_payment' check (status in ('awaiting_payment','paid','preparing','shipped','delivered','completed','cancelled','refund_pending','refunded')),
  stripe_session_id text unique,
  stripe_payment_intent_id text unique,
  delivery_days integer,
  deliver_by timestamptz,
  shipping_address jsonb,
  tracking_number text,
  carrier text,
  paid_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(buyer_id,request_key),
  check ((kind='gear' and listing_id is not null and departure_id is null) or (kind='charter' and departure_id is not null and listing_id is null)),
  check (commission_bps = case when kind='gear' and seller_class='dealer' then 0 else 500 end),
  check (commission_fils = round((total_fils-shipping_fils)::numeric * commission_bps / 10000))
);
create unique index commerce_one_trip_booking on public.commerce_orders(departure_id) where kind='charter' and status not in ('cancelled','refunded');
create index commerce_orders_overdue on public.commerce_orders(deliver_by) where kind='gear' and status in ('paid','preparing','shipped');
create table public.commerce_events (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.commerce_orders(id),
  event_type text not null, actor_id uuid references public.profiles(id), details jsonb not null default '{}', created_at timestamptz not null default now()
);
create table public.commerce_webhooks (event_id text primary key, created_at timestamptz not null default now());
create table public.commerce_outbox (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.commerce_orders(id),
  event_type text not null check(event_type in ('charter_booked','delivery_overdue')),
  status text not null default 'pending' check(status in ('pending','sending','sent')),
  attempts integer not null default 0, next_attempt_at timestamptz not null default now(), sent_at timestamptz,
  unique(order_id,event_type)
);
create table public.product_promotions (
  id uuid primary key default gen_random_uuid(), listing_id uuid not null references public.listings(id),
  bid_id uuid not null references public.ad_banner_bids(id),
  tag text not null check(tag in ('featured','new_on_market','hot_deal')),
  previous_price_fils integer check(previous_price_fils > 0),
  approved boolean not null default false,
  unique(listing_id,bid_id,tag)
);
-- No anonymous reads of customer addresses or payment account identifiers.
alter table public.commerce_merchants enable row level security;
alter table public.charter_departures enable row level security;
alter table public.commerce_orders enable row level security;
alter table public.commerce_events enable row level security;
alter table public.commerce_webhooks enable row level security;
alter table public.commerce_outbox enable row level security;
alter table public.product_promotions enable row level security;
create policy "Order parties read their orders" on public.commerce_orders for select to authenticated using (buyer_id=(select auth.uid()) or merchant_id=(select auth.uid()));
create policy "Order parties read their events" on public.commerce_events for select to authenticated using (exists(select 1 from public.commerce_orders o where o.id=order_id and (o.buyer_id=(select auth.uid()) or o.merchant_id=(select auth.uid()))));

create function public.reserve_commerce_order(p_buyer uuid,p_request uuid,p_kind text,p_item uuid,p_quantity integer)
returns public.commerce_orders language plpgsql security definer set search_path=public,pg_temp as $$
declare o public.commerce_orders; m public.commerce_merchants; l public.listings; d public.charter_departures; total integer; title_value text;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_buyer::text||p_request::text,0));
  select * into o from public.commerce_orders where buyer_id=p_buyer and request_key=p_request;
  if found then return o; end if;
  if p_quantity is null or p_quantity not between 1 and 20 then raise exception 'Invalid quantity'; end if;
  if p_kind='gear' then
    select * into l from public.listings where id=p_item for update;
    if not found or not l.is_active or l.is_sold or l.price is null or l.price<=0 or l.stock_quantity<p_quantity or coalesce(array_length(l.photos,1),0)=0 then raise exception 'Product is unavailable'; end if;
    select * into m from public.commerce_merchants where user_id=l.user_id and enabled;
    if not found or m.delivery_days is null then raise exception 'Seller is not ready for checkout'; end if;
    if m.seller_class='dealer' and (m.rental_paid_until is null or m.rental_paid_until<=now()) then raise exception 'Dealer rental has expired'; end if;
    total := (l.price*100)::integer*p_quantity+m.shipping_fils;
    title_value:=l.title;
  elsif p_kind='charter' then
    select * into d from public.charter_departures where id=p_item for update;
    if not found or not d.is_active or d.starts_at<=now() or p_quantity>d.capacity then raise exception 'Departure is unavailable'; end if;
    -- Also reject overlapping departures for this boat, not just identical slot IDs.
    perform pg_advisory_xact_lock(hashtextextended(d.charter_id::text,1));
    if exists(select 1 from public.commerce_orders x join public.charter_departures other on other.id=x.departure_id where other.charter_id=d.charter_id and x.status not in ('cancelled','refunded') and tstzrange(other.starts_at,other.ends_at,'[)') && tstzrange(d.starts_at,d.ends_at,'[)')) then raise exception 'This boat is already booked'; end if;
    select * into m from public.commerce_merchants where user_id=d.merchant_id and enabled;
    if not found then raise exception 'Operator is not ready for checkout'; end if;
    select name into title_value from public.charters where id=d.charter_id;
    total:=d.price_fils;
  else raise exception 'Invalid order kind'; end if;
  if m.user_id=p_buyer then raise exception 'You cannot purchase your own listing'; end if;
  if m.stripe_account_id is null then raise exception 'Seller payments are unavailable'; end if;
  insert into public.commerce_orders(request_key,buyer_id,merchant_id,kind,listing_id,departure_id,title,image_url,quantity,total_fils,shipping_fils,seller_class,commission_bps,commission_fils,stripe_account_id,delivery_days)
    values(p_request,p_buyer,m.user_id,p_kind,case when p_kind='gear' then l.id end,case when p_kind='charter' then d.id end,title_value,case when p_kind='gear' then l.photos[1] end,p_quantity,total,case when p_kind='gear' then m.shipping_fils else 0 end,m.seller_class,case when p_kind='gear' and m.seller_class='dealer' then 0 else 500 end,case when p_kind='gear' and m.seller_class='dealer' then 0 else round((total-case when p_kind='gear' then m.shipping_fils else 0 end)::numeric*.05)::integer end,m.stripe_account_id,case when p_kind='gear' then m.delivery_days end) returning * into o;
  if p_kind='gear' then update public.listings set stock_quantity=stock_quantity-p_quantity where id=l.id; end if;
  insert into public.commerce_events(order_id,event_type,actor_id) values(o.id,'reserved',p_buyer);
  return o;
end; $$;

create function public.fulfill_commerce_payment(p_event text,p_type text,p_session jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare o public.commerce_orders; oid uuid;
begin
  oid := (p_session->'metadata'->>'commerceOrderId')::uuid;
  select * into o from public.commerce_orders where id=oid for update;
  if not found then raise exception 'Unknown commerce order'; end if;
  if o.stripe_session_id is null or o.stripe_session_id<>p_session->>'id' then raise exception 'Checkout session mismatch'; end if;
  insert into public.commerce_webhooks(event_id) values(p_event) on conflict do nothing;
  if not found then return jsonb_build_object('duplicate',true); end if;
  if p_type in ('checkout.session.completed','checkout.session.async_payment_succeeded') and p_session->>'payment_status'='paid' then
    if (p_session->>'amount_total')::bigint<>o.total_fils or p_session->>'currency'<>'aed' then raise exception 'Payment amount mismatch'; end if;
    if o.status='awaiting_payment' then
      update public.commerce_orders set status='paid',stripe_payment_intent_id=p_session->>'payment_intent',paid_at=now(),deliver_by=case when kind='gear' then now()+make_interval(days=>delivery_days) end,shipping_address=coalesce(p_session->'collected_information'->'shipping_details',p_session->'shipping_details'),updated_at=now() where id=o.id;
      insert into public.commerce_events(order_id,event_type) values(o.id,'payment_confirmed');
      if o.kind='charter' then insert into public.commerce_outbox(order_id,event_type) values(o.id,'charter_booked') on conflict do nothing; end if;
    end if;
  elsif p_type in ('checkout.session.expired','checkout.session.async_payment_failed') and o.status='awaiting_payment' then
    update public.commerce_orders set status='cancelled',updated_at=now() where id=o.id;
    if o.kind='gear' then update public.listings set stock_quantity=stock_quantity+o.quantity where id=o.listing_id; end if;
    insert into public.commerce_events(order_id,event_type) values(o.id,'payment_cancelled');
  end if;
  return jsonb_build_object('ok',true);
end; $$;

create function public.advance_commerce_order(p_order uuid,p_actor uuid,p_status text,p_carrier text default null,p_tracking text default null)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare o public.commerce_orders; trip_end timestamptz;
begin
 select * into o from public.commerce_orders where id=p_order for update;
 if not found then raise exception 'Order not found'; end if;
 if p_actor=o.buyer_id and o.kind='gear' and o.status='shipped' and p_status='delivered' then
  update public.commerce_orders set status='delivered',delivered_at=now(),updated_at=now() where id=o.id;
 elsif p_actor=o.merchant_id and o.kind='gear' and ((o.status='paid' and p_status='preparing') or (o.status='preparing' and p_status='shipped')) then
  if p_status='shipped' and (length(trim(coalesce(p_carrier,'')))=0 or length(trim(coalesce(p_tracking,'')))=0) then raise exception 'Carrier and tracking number required'; end if;
  update public.commerce_orders set status=p_status,carrier=left(p_carrier,100),tracking_number=left(p_tracking,150),updated_at=now() where id=o.id;
 elsif p_actor=o.merchant_id and o.kind='charter' and o.status='paid' and p_status='completed' then
  select ends_at into trip_end from public.charter_departures where id=o.departure_id;
  if trip_end>now() then raise exception 'Trip has not ended'; end if;
  update public.commerce_orders set status='completed',updated_at=now() where id=o.id;
 else raise exception 'Transition not permitted'; end if;
 insert into public.commerce_events(order_id,event_type,actor_id) values(o.id,p_status,p_actor);
end; $$;

create function public.claim_commerce_notifications() returns setof public.commerce_outbox
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 insert into public.commerce_outbox(order_id,event_type) select id,'delivery_overdue' from public.commerce_orders where kind='gear' and status in ('paid','preparing','shipped') and deliver_by<now() on conflict do nothing;
 return query update public.commerce_outbox x set status='sending',attempts=attempts+1,next_attempt_at=now()+interval '10 minutes'
 where x.id in (select q.id from public.commerce_outbox q where q.status in ('pending','sending') and q.next_attempt_at<=now() order by q.next_attempt_at limit 20 for update skip locked) returning x.*;
end; $$;
revoke all on function public.reserve_commerce_order(uuid,uuid,text,uuid,integer) from public,anon,authenticated;
revoke all on function public.fulfill_commerce_payment(text,text,jsonb) from public,anon,authenticated;
revoke all on function public.advance_commerce_order(uuid,uuid,text,text,text) from public,anon,authenticated;
revoke all on function public.claim_commerce_notifications() from public,anon,authenticated;
grant execute on function public.reserve_commerce_order(uuid,uuid,text,uuid,integer) to service_role;
grant execute on function public.fulfill_commerce_payment(text,text,jsonb) to service_role;
grant execute on function public.advance_commerce_order(uuid,uuid,text,text,text) to service_role;
grant execute on function public.claim_commerce_notifications() to service_role;
commit;
