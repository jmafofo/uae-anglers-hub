-- ============================================================
-- Site visitor tracking (idempotent fix)
-- ============================================================

create table if not exists public.site_visits (
  id         uuid primary key default gen_random_uuid(),
  ip_hash    text not null,
  visited_at timestamptz default now()
);

create index if not exists site_visits_ip_hash_ix on public.site_visits (ip_hash);
create index if not exists site_visits_visited_at_ix on public.site_visits (visited_at desc);

-- Add unique constraint if missing (PostgreSQL has no ADD CONSTRAINT IF NOT EXISTS)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'site_visits_ip_hash_uq'
      and conrelid = 'public.site_visits'::regclass
  ) then
    alter table public.site_visits
      add constraint site_visits_ip_hash_uq unique (ip_hash);
  end if;
end $$;

-- Public read for the visitor count display
alter table public.site_visits enable row level security;

drop policy if exists "Site visits count is public" on public.site_visits;
create policy "Site visits count is public"
  on public.site_visits for select using (true);
