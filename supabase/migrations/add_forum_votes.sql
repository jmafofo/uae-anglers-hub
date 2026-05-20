-- ============================================================
-- UAE Anglers Hub — Forum votes (real, per-user, dedupable)
--
-- Replaces the bare `upvotes` integer counters on forum_threads
-- and forum_replies with an actual votes table. The counter
-- columns stay (the listing pages already read them) but are now
-- maintained by triggers from forum_votes — so the count always
-- reflects real per-user votes, not a free-for-all integer.
--
-- Vote semantics: a row in forum_votes means "this user upvoted
-- this target". Removing the row = un-upvote. There are no
-- downvotes (current UI doesn't expose any) so no `value` column —
-- the row's existence IS the vote.
--
-- Backfill: the existing `upvotes` counters are reset to 0 on
-- migration. They had no integrity (any user could bump them
-- unbounded), so re-zeroing is the honest move. If the historical
-- counts mattered you'd back them up first.
-- ============================================================

-- ── 1. Votes table ─────────────────────────────────────────
create table if not exists public.forum_votes (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('thread', 'reply')),
  target_id   uuid not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);

create index if not exists forum_votes_target_ix
  on public.forum_votes (target_type, target_id);

alter table public.forum_votes enable row level security;

-- Everyone can see who voted on what (lets the UI light up the
-- thumbs-up button for the viewing user without an extra
-- per-row query).
drop policy if exists "Forum votes viewable by all" on public.forum_votes;
create policy "Forum votes viewable by all"
  on public.forum_votes for select using (true);

drop policy if exists "Users vote as themselves" on public.forum_votes;
create policy "Users vote as themselves"
  on public.forum_votes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users remove own vote" on public.forum_votes;
create policy "Users remove own vote"
  on public.forum_votes for delete
  using (auth.uid() = user_id);
-- No UPDATE policy — votes are immutable; toggle = insert/delete.


-- ── 2. Recount trigger ─────────────────────────────────────
-- After insert/delete on forum_votes, refresh the cached
-- `upvotes` column on the underlying target. SECURITY DEFINER
-- because the trigger needs to write across user RLS scopes
-- (a thread owner shouldn't have to grant write to other users
-- just because someone upvoted them).
create or replace function public.forum_votes_recount()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  ttype text;
  tid   uuid;
  new_count int;
begin
  if tg_op = 'INSERT' then
    ttype := new.target_type;
    tid   := new.target_id;
  else
    ttype := old.target_type;
    tid   := old.target_id;
  end if;

  select count(*) into new_count
  from public.forum_votes
  where target_type = ttype and target_id = tid;

  if ttype = 'thread' then
    update public.forum_threads set upvotes = new_count where id = tid;
  else
    update public.forum_replies set upvotes = new_count where id = tid;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists forum_votes_recount_insert on public.forum_votes;
create trigger forum_votes_recount_insert
  after insert on public.forum_votes
  for each row execute procedure public.forum_votes_recount();

drop trigger if exists forum_votes_recount_delete on public.forum_votes;
create trigger forum_votes_recount_delete
  after delete on public.forum_votes
  for each row execute procedure public.forum_votes_recount();


-- ── 3. Backfill ────────────────────────────────────────────
-- Reset the cached counters. They had no integrity before this
-- migration; new counts will be exact going forward.
update public.forum_threads set upvotes = 0;
update public.forum_replies set upvotes = 0;
