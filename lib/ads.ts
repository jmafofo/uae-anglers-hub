/**
 * Shared ad-picker logic used by both the mobile JSON API
 * (/api/ads/next) and the web AdSlot server component.
 *
 * Design:
 *   1. pickAndRecordAd() picks the highest-scoring active campaign
 *      for a (placement, species, emirate) context, records an
 *      impression atomically (decrementing budget), and returns
 *      the creative + impression id.
 *   2. recordClick() inserts a click row and bumps the campaign's
 *      click counter.
 *
 * Both functions use the service-role client so impressions /
 * clicks are recorded regardless of caller auth — anonymous web
 * traffic still gets billed correctly.
 *
 * Premium users (ocean_sentinel_premium = true) bypass ads — see
 * shouldShowAds() helper.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type Placement =
  | 'identify_result'
  | 'spot_sidebar'
  | 'home_banner'
  | 'ban_banner';

export type AdContext = {
  species?: string | null;
  emirate?: string | null;
};

export type Ad = {
  id: string;
  impression_id: string;
  sponsor_id: string;
  sponsor_name: string;
  sponsor_logo: string | null;
  headline: string;
  body: string | null;
  image_url: string | null;
  cta_text: string;
  target_url: string;
  charge_aed: number;
};

export const PLACEMENTS: Placement[] = [
  'identify_result',
  'spot_sidebar',
  'home_banner',
  'ban_banner',
];

let _admin: SupabaseClient | null = null;
function adminClient(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );
  }
  return _admin;
}

/**
 * Returns the next ad for a placement+context, recording the
 * impression in the same call. Returns null when no eligible
 * campaign exists, or when the requesting user is premium.
 */
export async function pickAndRecordAd(
  placement: Placement,
  context: AdContext = {},
  user: { id: string; isPremium: boolean } | null = null,
): Promise<Ad | null> {
  if (user?.isPremium) return null;

  const sb = adminClient();

  const { data: picked, error: pickErr } = await sb
    .rpc('pick_next_ad', {
      p_placement: placement,
      p_species:   context.species ?? null,
      p_emirate:   context.emirate ?? null,
    })
    .maybeSingle<{
      id: string;
      sponsor_id: string;
      sponsor_name: string;
      sponsor_logo: string | null;
      headline: string;
      body: string | null;
      image_url: string | null;
      cta_text: string;
      target_url: string;
      charge_aed: number;
    }>();

  if (pickErr) {
    console.error('[ads] pick_next_ad failed', pickErr);
    return null;
  }
  if (!picked) return null;

  const { data: impressionId, error: impErr } = await sb.rpc('record_ad_impression', {
    p_campaign_id: picked.id,
    p_placement:   placement,
    p_user_id:     user?.id ?? null,
    p_context:     {
      species: context.species ?? null,
      emirate: context.emirate ?? null,
    },
  });
  if (impErr || !impressionId) {
    console.error('[ads] record_ad_impression failed', impErr);
    return null;
  }

  return {
    id:            picked.id,
    impression_id: impressionId as unknown as string,
    sponsor_id:    picked.sponsor_id,
    sponsor_name:  picked.sponsor_name,
    sponsor_logo:  picked.sponsor_logo,
    headline:      picked.headline,
    body:          picked.body,
    image_url:     picked.image_url,
    cta_text:      picked.cta_text,
    target_url:    picked.target_url,
    charge_aed:    Number(picked.charge_aed),
  };
}

/** Records a click. Used by the redirect endpoint. */
export async function recordClick(
  campaignId: string,
  impressionId: string | null,
  userId: string | null,
): Promise<void> {
  const sb = adminClient();
  await sb.rpc('record_ad_click', {
    p_campaign_id:   campaignId,
    p_impression_id: impressionId,
    p_user_id:       userId,
  });
}
