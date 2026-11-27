-- Deploy before the webhook code. Existing event IDs remain deduplicated;
-- previously failed historical events require manual reconciliation.
create or replace function public.fulfill_stripe_event(
  p_event_id text, p_event_type text, p_object jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid;
  v_type text := p_object #>> '{metadata,type}';
  v_customer text;
  v_payment text;
  v_qty integer;
  v_listing uuid;
  v_bid uuid;
  v_notify_bid uuid;
begin
  -- Concurrent deliveries serialize on the unique event ID. Any later error
  -- rolls this insert back along with all fulfillment writes and triggers.
  insert into public.stripe_events(event_id, type)
  values (p_event_id, p_event_type)
  on conflict (event_id) do nothing;
  if not found then
    return jsonb_build_object('duplicate', true);
  end if;

  if p_event_type not in ('checkout.session.completed', 'customer.subscription.deleted', 'customer.subscription.updated') then
    return jsonb_build_object('duplicate', false);
  end if;
  v_user := nullif(p_object #>> '{metadata,userId}', '')::uuid;
  if v_user is null then
    return jsonb_build_object('duplicate', false);
  end if;
  -- Fail rather than acknowledge a paid event that cannot update its owner.
  perform 1 from public.profiles where id = v_user for update;
  if not found then
    raise exception 'Stripe fulfillment profile not found';
  end if;

  if p_event_type = 'checkout.session.completed' then
    v_customer := case when jsonb_typeof(p_object->'customer') = 'object'
      then p_object #>> '{customer,id}' else p_object->>'customer' end;
    v_payment := case when jsonb_typeof(p_object->'payment_intent') = 'object'
      then p_object #>> '{payment_intent,id}' else p_object->>'payment_intent' end;
    if v_customer is not null then
      update public.profiles set stripe_customer_id = v_customer
      where id = v_user and stripe_customer_id is null;
    end if;

    if v_type = 'ocean_sentinel' then
      update public.profiles set ocean_sentinel_premium = true,
        ocean_sentinel_premium_until = null where id = v_user;
    elsif v_type in ('pro', 'business') then
      update public.profiles set subscription_tier = v_type,
        subscription_status = 'active', account_type = v_type,
        listing_slots_included = case when v_type = 'pro' then 50 else 999999 end,
        verified_retailer = true where id = v_user;
    elsif v_type = 'slots' then
      v_qty := coalesce(p_object #>> '{metadata,qty}', '1')::integer;
      if v_qty < 1 or v_qty > 50 then
        raise exception 'Invalid slot quantity';
      end if;
      insert into public.slot_purchases(user_id, slots_qty, amount_aed, payment_ref)
      values (v_user, v_qty, v_qty * 5, v_payment);
    elsif v_type = 'boost' then
      v_listing := (p_object #>> '{metadata,listingId}')::uuid;
      insert into public.boost_purchases(user_id, listing_id, amount_aed, duration_days, boosted_from, payment_ref)
      values (v_user, v_listing, 20, 7, now(), v_payment);
      update public.listings set is_boosted = true,
        boosted_until = now() + interval '7 days' where id = v_listing;
      if not found then raise exception 'Boost listing not found'; end if;
    elsif v_type = 'banner_bid' then
      v_bid := (p_object #>> '{metadata,bidId}')::uuid;
      perform 1 from public.ad_banner_bids where id = v_bid for update;
      if not found then raise exception 'Banner bid not found'; end if;
      update public.ad_banner_bids set status = 'pending_approval',
        stripe_payment_intent_id = v_payment, stripe_capture_status = 'authorized'
      where id = v_bid and status = 'draft';
      if found then v_notify_bid := v_bid; end if;
    end if;
  elsif p_event_type = 'customer.subscription.deleted' then
    if v_type = 'ocean_sentinel' then
      update public.profiles set ocean_sentinel_premium = false,
        ocean_sentinel_premium_until = now() where id = v_user;
    else
      update public.profiles set subscription_tier = 'free',
        subscription_status = 'cancelled', account_type = 'individual',
        listing_slots_included = 5, verified_retailer = false where id = v_user;
    end if;
  elsif p_event_type = 'customer.subscription.updated'
      and p_object->>'status' = 'active' and v_type in ('pro', 'business') then
    update public.profiles set subscription_tier = v_type,
      subscription_status = 'active', account_type = v_type,
      listing_slots_included = case when v_type = 'pro' then 50 else 999999 end,
      verified_retailer = true where id = v_user;
  end if;
  return jsonb_build_object('duplicate', false, 'bid_id', v_notify_bid);
end;
$$;

revoke all on function public.fulfill_stripe_event(text, text, jsonb) from public, anon, authenticated;
grant execute on function public.fulfill_stripe_event(text, text, jsonb) to service_role;
