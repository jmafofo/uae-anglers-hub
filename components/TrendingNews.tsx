import Link from 'next/link';
import { Newspaper, AlertTriangle, ExternalLink, Ban, CalendarDays, ArrowRight } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import speciesPhotos from '@/lib/species-photos.json';

type NewsItem = {
  id: string;
  slug: string;
  category: 'fishing' | 'marine_life' | 'regulation' | 'tournament' | 'conservation';
  headline: string;
  excerpt: string | null;
  hero_image_url: string | null;
  source_url: string | null;
  source_name: string | null;
  is_featured: boolean;
  published_at: string;
};

type SeasonalBan = {
  id: string;
  title: string;
  description: string | null;
  species_slugs: string[] | null;
  species_names: string[] | null;
  ban_start_month: number | null;
  ban_start_day: number | null;
  ban_end_month: number | null;
  ban_end_day: number | null;
  ban_scope: string | null;
  authority: string | null;
  source_url: string | null;
  applies_to_coast: string | null;
};

const CATEGORY_LABELS: Record<NewsItem['category'], string> = {
  fishing: 'Fishing',
  marine_life: 'Marine life',
  regulation: 'Regulation',
  tournament: 'Tournament',
  conservation: 'Conservation',
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmtBan(m: number | null, d: number | null) {
  if (!m || !d) return '';
  return `${d} ${MONTHS[m - 1]}`;
}

function speciesPhoto(slug: string): string | null {
  const list = (speciesPhotos as Record<string, string[]>)[slug];
  return list?.[0] ?? null;
}

export async function TrendingNews() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const [{ data: news }, { data: bansRaw }] = await Promise.all([
    sb.from('news_items')
      .select('id, slug, category, headline, excerpt, hero_image_url, source_url, source_name, is_featured, published_at')
      .order('published_at', { ascending: false })
      .limit(6),
    sb.rpc('current_seasonal_bans'),
  ]);

  const items = (news ?? []) as NewsItem[];
  const bans = (bansRaw ?? []) as SeasonalBan[];

  // Don't render an empty rail.
  if (items.length === 0 && bans.length === 0) return null;

  return (
    <section className="py-20 px-4 bg-[#050b15]">
      <div className="max-w-6xl mx-auto">

        {/* ── Seasonal bans ─────────────────────────────────────── */}
        {bans.length > 0 && (
          <div className="mb-16">
            <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
              <div>
                <div className="inline-flex items-center gap-1.5 text-red-400 text-xs font-bold tracking-wider uppercase mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Active right now
                </div>
                <h2 className="text-3xl font-extrabold text-white">Seasonal fishing bans</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Species currently protected under MOCCAE rules. Release any accidental catches immediately.
                </p>
              </div>
              <Link href="/regulations" className="inline-flex items-center gap-1 text-sm text-teal-400 hover:text-teal-300 shrink-0">
                All regulations <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {bans.map(ban => {
                const slugs = ban.species_slugs ?? [];
                const names = ban.species_names ?? [];
                return (
                  <div key={ban.id} className="relative rounded-2xl border border-red-500/25 bg-gradient-to-br from-red-500/[0.06] via-transparent to-transparent p-5 overflow-hidden">
                    <div className="flex items-start gap-2 mb-3 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 border border-red-500/30 font-bold uppercase tracking-wider">
                        <Ban className="w-3 h-3" /> Banned
                      </span>
                      {ban.ban_start_month && ban.ban_end_month && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-gray-300 border border-white/10">
                          <CalendarDays className="w-3 h-3" />
                          {fmtBan(ban.ban_start_month, ban.ban_start_day)} → {fmtBan(ban.ban_end_month, ban.ban_end_day)}
                        </span>
                      )}
                      {ban.authority && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10">
                          {ban.authority}
                        </span>
                      )}
                    </div>

                    <h3 className="text-white font-bold leading-snug mb-3">{ban.title}</h3>

                    {slugs.length > 0 && (
                      <ul className="flex flex-wrap gap-3 mb-3">
                        {slugs.map((slug, i) => {
                          const photo = speciesPhoto(slug);
                          const name = names[i] ?? slug;
                          return (
                            <li key={slug} className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg pl-1 pr-3 py-1">
                              {photo ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={photo} alt={name} className="w-10 h-10 rounded object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded bg-white/5 border border-white/10" />
                              )}
                              <Link href={`/species/${slug}`} className="text-sm text-white hover:text-teal-400 transition-colors">
                                {name}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    {ban.description && (
                      <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">{ban.description}</p>
                    )}

                    {ban.source_url && (
                      <a href={ban.source_url} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 mt-3">
                        Official source <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Trending news ─────────────────────────────────────── */}
        {items.length > 0 && (
          <div>
            <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
              <div>
                <div className="inline-flex items-center gap-1.5 text-teal-400 text-xs font-bold tracking-wider uppercase mb-1">
                  <Newspaper className="w-3.5 h-3.5" />
                  From the water
                </div>
                <h2 className="text-3xl font-extrabold text-white">Trending</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Fishing, marine life, and conservation updates curated for UAE anglers.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map(n => {
                const Wrapper = n.source_url
                  ? ({ children }: { children: React.ReactNode }) =>
                      <a href={n.source_url!} target="_blank" rel="noreferrer" className="group block">{children}</a>
                  : ({ children }: { children: React.ReactNode }) =>
                      <div className="group block">{children}</div>;
                return (
                  <Wrapper key={n.id}>
                    <article className="h-full flex flex-col rounded-xl bg-white/[0.03] border border-white/10 overflow-hidden hover:border-teal-500/40 transition-colors">
                      {n.hero_image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={n.hero_image_url} alt="" className="w-full h-40 object-cover group-hover:scale-[1.02] transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-40 bg-gradient-to-br from-teal-500/10 to-transparent border-b border-white/5 flex items-center justify-center">
                          <Newspaper className="w-10 h-10 text-white/10" />
                        </div>
                      )}
                      <div className="flex flex-col flex-1 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                            {CATEGORY_LABELS[n.category]}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(n.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </span>
                          {n.is_featured && (
                            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold uppercase tracking-wider">
                              Featured
                            </span>
                          )}
                        </div>
                        <h3 className="text-white font-semibold leading-snug mb-2 group-hover:text-teal-400 transition-colors line-clamp-2">
                          {n.headline}
                        </h3>
                        {n.excerpt && (
                          <p className="text-gray-400 text-sm line-clamp-3 mb-3">{n.excerpt}</p>
                        )}
                        {n.source_name && (
                          <span className="mt-auto inline-flex items-center gap-1 text-xs text-gray-500">
                            {n.source_name}
                            {n.source_url && <ExternalLink className="w-3 h-3" />}
                          </span>
                        )}
                      </div>
                    </article>
                  </Wrapper>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
