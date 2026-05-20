-- ============================================================
-- Suggestions / Feedback Board
--
-- Public feature-request system where anglers can propose
-- improvements and vote on ideas.
-- ============================================================

-- 1. Suggestions table
 create table if not exists public.suggestions (
   id          uuid primary key default gen_random_uuid(),
   user_id     uuid not null references public.profiles(id) on delete cascade,
   title       text not null check (char_length(title) between 5 and 200),
   body        text check (body is null or char_length(body) <= 2000),
   category    text not null default 'feature'
               check (category in ('feature', 'bug', 'improvement', 'content', 'other')),
   status      text not null default 'pending'
               check (status in ('pending', 'under_review', 'planned', 'implemented', 'declined')),
   votes       int not null default 0,
   created_at  timestamptz not null default now(),
   updated_at  timestamptz not null default now()
 );

 create index if not exists suggestions_status_ix on public.suggestions (status);
 create index if not exists suggestions_votes_ix   on public.suggestions (votes desc);
 create index if not exists suggestions_created_ix on public.suggestions (created_at desc);

-- 2. Votes table (one vote per user per suggestion)
 create table if not exists public.suggestion_votes (
   suggestion_id uuid not null references public.suggestions(id) on delete cascade,
   user_id       uuid not null references public.profiles(id) on delete cascade,
   created_at    timestamptz not null default now(),
   primary key (suggestion_id, user_id)
 );

-- 3. Vote-count helper trigger
--    Keeps suggestions.votes in sync so listing is fast.
 create or replace function public.suggestion_vote_sync()
 returns trigger
 language plpgsql
 security definer
 set search_path = public, pg_temp
 as $$
 begin
   if tg_op = 'INSERT' then
     update public.suggestions set votes = votes + 1 where id = new.suggestion_id;
     return new;
   elsif tg_op = 'DELETE' then
     update public.suggestions set votes = votes - 1 where id = old.suggestion_id;
     return old;
   end if;
   return null;
 end;
 $$;

 drop trigger if exists suggestion_vote_sync_trigger on public.suggestion_votes;
 create trigger suggestion_vote_sync_trigger
   after insert or delete on public.suggestion_votes
   for each row execute procedure public.suggestion_vote_sync();

-- 4. RLS
 alter table public.suggestions enable row level security;
 alter table public.suggestion_votes enable row level security;

-- Everyone can read suggestions
 drop policy if exists "Suggestions are public" on public.suggestions;
 create policy "Suggestions are public"
   on public.suggestions for select to anon, authenticated
   using (true);

-- Authenticated users can create their own
 drop policy if exists "Users create own suggestions" on public.suggestions;
 create policy "Users create own suggestions"
   on public.suggestions for insert to authenticated
   with check (auth.uid() = user_id);

-- Only admins can update status
 drop policy if exists "Admins update suggestion status" on public.suggestions;
 create policy "Admins update suggestion status"
   on public.suggestions for update to authenticated
   using (
     exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
   )
   with check (
     exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
   );

-- Everyone can read votes (to show "you voted")
 drop policy if exists "Votes are public" on public.suggestion_votes;
 create policy "Votes are public"
   on public.suggestion_votes for select to anon, authenticated
   using (true);

-- Authenticated users can vote once
 drop policy if exists "Users vote once" on public.suggestion_votes;
 create policy "Users vote once"
   on public.suggestion_votes for insert to authenticated
   with check (auth.uid() = user_id);

-- Users can remove their own vote
 drop policy if exists "Users remove own vote" on public.suggestion_votes;
 create policy "Users remove own vote"
   on public.suggestion_votes for delete to authenticated
   using (auth.uid() = user_id);
