-- ============================================================
-- Site visitor tracking
-- ============================================================

create table if not exists public.site_visits (
  id         uuid primary key default gen_random_uuid(),
  ip_hash    text not null,
  visited_at timestamptz default now()
);

create index if not exists site_visits_ip_hash_ix on public.site_visits (ip_hash);
create index if not exists site_visits_visited_at_ix on public.site_visits (visited_at desc);

-- Public read for the visitor count display
alter table public.site_visits enable row level security;

create policy "Site visits count is public"
  on public.site_visits for select using (true);
