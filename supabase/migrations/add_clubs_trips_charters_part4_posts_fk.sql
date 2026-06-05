-- ============================================================
-- Part 4: Add FK to posts + author policies (OPTIONAL)
-- Only run this AFTER public.posts exists.
-- If you haven't run add_posts_system.sql yet, skip this for now.
-- ============================================================

-- Add FK constraint to trip_posts.post_id if posts table exists
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'posts'
  ) then
    -- Add FK if not already present
    if not exists (
      select 1 from information_schema.table_constraints
      where table_schema = 'public'
        and table_name = 'trip_posts'
        and constraint_name = 'trip_posts_post_id_fkey'
    ) then
      alter table public.trip_posts
        add constraint trip_posts_post_id_fkey
        foreign key (post_id) references public.posts(id) on delete cascade;
    end if;
  end if;
end $$;

-- Add author-based update/delete policies if posts table exists
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'posts'
  ) then
    -- Drop if exists first (idempotent)
    drop policy if exists "Post authors can update their trip posts" on public.trip_posts;
    drop policy if exists "Post authors can delete their trip posts" on public.trip_posts;

    create policy "Post authors can update their trip posts"
      on public.trip_posts for update
      using (
        auth.uid() = (
          select user_id from public.posts where id = trip_posts.post_id
        )
      );

    create policy "Post authors can delete their trip posts"
      on public.trip_posts for delete
      using (
        auth.uid() = (
          select user_id from public.posts where id = trip_posts.post_id
        )
      );
  end if;
end $$;
