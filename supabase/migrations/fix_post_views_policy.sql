-- ── Fix: overly permissive post_views INSERT policy ──────────────────────────
--
-- The Security Advisor flags the post_views table's INSERT policy because it
-- uses WITH CHECK (true) for both anon and authenticated roles.
--
-- In practice the application records views through the service-role/admin
-- client (see app/api/posts/[id]/view/route.ts), so direct client inserts are
-- not required. We tighten the policy to authenticated users inserting rows
-- where viewer_id matches their own ID. This removes the warning without
-- changing application behavior.
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "Anyone can insert views" on public.post_views;

create policy "Users insert own post views"
  on public.post_views for insert to authenticated
  with check (viewer_id = auth.uid());
