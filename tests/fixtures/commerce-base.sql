create role anon; create role authenticated; create role service_role;
create schema auth; create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;
create table profiles(id uuid primary key);
create table listings(id uuid primary key,user_id uuid references profiles(id),title text,photos text[],price numeric(10,2),is_active boolean default true,is_sold boolean default false,seller_type text default 'individual');
create table charters(id uuid primary key,name text);
create table ad_banner_slots(id uuid primary key,is_active boolean);
create table ad_banner_bids(id uuid primary key,user_id uuid,slot_id uuid,status text,stripe_capture_status text,stripe_payment_intent_id text,start_date date,ends_at timestamptz);
