/**
 * POST /api/admin/migrate
 *
 * ONE-TIME migration endpoint — runs pending Supabase migrations directly
 * via a PostgreSQL connection. Used when Supabase dashboard is inaccessible.
 *
 * DELETE THIS FILE AND REDEPLOY once the migrations have been run.
 *
 * Required env vars (add to Vercel before deploying):
 *   MIGRATION_SECRET   — a random string you choose; sent as Bearer token
 *   DATABASE_URL       — postgresql://postgres:[password]@db.pxpbbjphkvwvgmdapiqs.supabase.co:5432/postgres
 */

import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

// ── Pending migrations (in order) ─────────────────────────────────────────────

const MIGRATIONS = [

  // ── 1. Creator fields ──────────────────────────────────────────────────────
  {
    name: 'add_creator_fields',
    sql: `
      ALTER TABLE profiles
        ADD COLUMN IF NOT EXISTS is_creator        boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS creator_bio       text,
        ADD COLUMN IF NOT EXISTS youtube_channel   text,
        ADD COLUMN IF NOT EXISTS tiktok_handle     text,
        ADD COLUMN IF NOT EXISTS instagram_handle  text,
        ADD COLUMN IF NOT EXISTS facebook_page     text;

      ALTER TABLE catches
        ADD COLUMN IF NOT EXISTS video_url  text,
        ADD COLUMN IF NOT EXISTS source     text NOT NULL DEFAULT 'web';

      CREATE INDEX IF NOT EXISTS idx_catches_source   ON catches(source);
      CREATE INDEX IF NOT EXISTS idx_catches_video    ON catches(video_url) WHERE video_url IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_profiles_creator ON profiles(is_creator) WHERE is_creator = true;
    `,
  },

  // ── 2. Revoke SECURITY DEFINER exposure ───────────────────────────────────
  {
    name: 'fix_security_definer_exposure',
    sql: `
      REVOKE EXECUTE ON FUNCTION public.handle_new_user()              FROM public;
      REVOKE EXECUTE ON FUNCTION public.resolve_catch_spot()           FROM public;
      REVOKE EXECUTE ON FUNCTION public.recount_waypoint_votes()       FROM public;
      REVOKE EXECUTE ON FUNCTION public.sync_listing_slot_count()      FROM public;
      REVOKE EXECUTE ON FUNCTION public.update_catch_count()           FROM public;
      REVOKE EXECUTE ON FUNCTION public.increment_reply_count()        FROM public;
      REVOKE EXECUTE ON FUNCTION public.apply_slot_purchase()          FROM public;
      REVOKE EXECUTE ON FUNCTION public.apply_tier_slot_defaults()     FROM public;
      REVOKE EXECUTE ON FUNCTION public.expire_boosts()                FROM public;

      REVOKE EXECUTE ON FUNCTION public.listing_slots_available(uuid)  FROM public;
      GRANT  EXECUTE ON FUNCTION public.listing_slots_available(uuid)  TO authenticated;

      REVOKE EXECUTE ON FUNCTION public.waypoint_within_spot(uuid, numeric, numeric, integer) FROM public;
      GRANT  EXECUTE ON FUNCTION public.waypoint_within_spot(uuid, numeric, numeric, integer) TO authenticated;

      REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text)              FROM public;
      REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text)        FROM public;
      REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text, boolean) FROM public;
    `,
  },

  // ── 3. Convert RPC helpers to SECURITY INVOKER ────────────────────────────
  {
    name: 'fix_rpc_security_invoker',
    sql: `
      CREATE OR REPLACE FUNCTION public.listing_slots_available(profile_id uuid)
      RETURNS int
      LANGUAGE plpgsql
      STABLE
      SECURITY INVOKER
      SET search_path = public, pg_temp
      AS $$
      DECLARE
        rec record;
      BEGIN
        SELECT listing_slots_included, listing_slots_extra, listing_slots_used, subscription_tier
        INTO rec FROM public.profiles WHERE id = profile_id;
        IF rec.subscription_tier = 'business' THEN RETURN 999999; END IF;
        RETURN (rec.listing_slots_included + rec.listing_slots_extra) - rec.listing_slots_used;
      END;
      $$;

      CREATE OR REPLACE FUNCTION public.waypoint_within_spot(
        p_spot_id  uuid,
        p_lat      numeric,
        p_lon      numeric,
        p_radius_m int DEFAULT 7000
      )
      RETURNS boolean
      LANGUAGE plpgsql
      STABLE
      SECURITY INVOKER
      SET search_path = public, pg_temp
      AS $$
      DECLARE
        hit boolean;
        pt  geography := st_setsrid(st_makepoint(p_lon, p_lat), 4326)::geography;
      BEGIN
        SELECT EXISTS (
          SELECT 1 FROM public.spots s
          WHERE s.id = p_spot_id AND (
            (s.geometry IS NOT NULL AND st_dwithin(s.geometry, pt, 150))
            OR st_dwithin(
                 st_setsrid(st_makepoint(s.center_lon, s.center_lat), 4326)::geography,
                 pt, p_radius_m)
          )
        ) INTO hit;
        RETURN coalesce(hit, false);
      END;
      $$;
    `,
  },

];

// ── Handler ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth check
  const auth = req.headers.get('authorization') ?? '';
  const secret = process.env.MIGRATION_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return NextResponse.json(
      { error: 'DATABASE_URL env var not set. Add it to Vercel before running.' },
      { status: 500 }
    );
  }

  const sql = postgres(dbUrl, { ssl: 'require', max: 1 });
  const results: { name: string; status: string; error?: string }[] = [];

  for (const migration of MIGRATIONS) {
    try {
      await sql.unsafe(migration.sql);
      results.push({ name: migration.name, status: 'ok' });
      console.log(`[migrate] ✓ ${migration.name}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ name: migration.name, status: 'error', error: msg });
      console.error(`[migrate] ✗ ${migration.name}:`, msg);
      // Continue — some statements may already be applied
    }
  }

  await sql.end();
  return NextResponse.json({ migrations: results });
}
