-- ============================================================
-- UAE Anglers Hub — Add downvotes to forum votes
--
-- Builds on add_forum_votes.sql. Adds a `value` column to
-- forum_votes (1 = upvote, -1 = downvote) and a `downvotes`
-- counter column on forum_threads + forum_replies. The recount
-- trigger now keeps both counters in sync.
--
-- The unique PK on (user_id, target_type, target_id) still
-- guarantees ONE vote per user per target — you can either
-- upvote OR downvote, not both, and never twice. Switching
-- direction = update value (or delete + insert).
-- ============================================================

-- ── 1. Value column ────────────────────────────────────────
alter table public.forum_votes
  add column if not exists value smallint not null default 1;

alter table public.forum_votes
  drop constraint if exists forum_votes_value_check;
alter table public.forum_votes
  add constraint forum_votes_value_check check (value in (-1, 1));


-- ── 2. Downvote counter columns ────────────────────────────
alter table public.forum_threads
  add column if not exists downvotes int not null default 0;

alter table public.forum_replies
  add column if not exists downvotes int not null default 0;


-- ── 3. Replace recount trigger ─────────────────────────────
-- Same shape as before, just splits the count by value sign so
-- both counters stay accurate. AFTER UPDATE is also needed now —
-- switching direction (upvote → downvote) doesn't insert/delete,
-- it updates the existing row.
create or replace function public.forum_votes_recount()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  ttype text;
  tid   uuid;
  up_count int;
  down_count int;
begin
  if tg_op = 'DELETE' then
    ttype := old.target_type;
    tid   := old.target_id;
  else
    ttype := new.target_type;
    tid   := new.target_id;
  end if;

  select
    count(*) filter (where value = 1),
    count(*) filter (where value = -1)
  into up_count, down_count
  from public.forum_votes
  where target_type = ttype and target_id = tid;

  if ttype = 'thread' then
    update public.forum_threads
      set upvotes = up_count, downvotes = down_count
      where id = tid;
  else
    update public.forum_replies
      set upvotes = up_count, downvotes = down_count
      where id = tid;
  end if;

  return coalesce(new, old);
end;
$$;

-- Re-create triggers (drop existing so the new function takes effect).
drop trigger if exists forum_votes_recount_insert on public.forum_votes;
create trigger forum_votes_recount_insert
  after insert on public.forum_votes
  for each row execute procedure public.forum_votes_recount();

drop trigger if exists forum_votes_recount_delete on public.forum_votes;
create trigger forum_votes_recount_delete
  after delete on public.forum_votes
  for each row execute procedure public.forum_votes_recount();

-- New: handle value flips (upvote → downvote without insert/delete).
drop trigger if exists forum_votes_recount_update on public.forum_votes;
create trigger forum_votes_recount_update
  after update of value on public.forum_votes
  for each row execute procedure public.forum_votes_recount();


-- ── 4. Allow users to update their own vote ───────────────
-- The original migration intentionally omitted UPDATE so toggles
-- worked as insert/delete. Now switching direction is a value
-- update, so we need an UPDATE policy.
drop policy if exists "Users update own vote" on public.forum_votes;
create policy "Users update own vote"
  on public.forum_votes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ── 5. Backfill: re-run the counter on every row ──────────
-- Touch every vote with a no-op update so the trigger refreshes
-- both counters. Safe because the trigger is idempotent.
update public.forum_votes set value = value;
