import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Anchor, MapPin, Clock, Users, Fish, Star,
  Phone, ChevronRight, Waves, Shield, ArrowRight,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

export const metadata: Metadata = {
  title: 'UAE Fishing Charters — Book a Boat | UAE Anglers Hub',
  description:
    'Book fishing charters across the UAE. Deep-sea, inshore and offshore trips from Dubai, Abu Dhabi, Fujairah, RAK and more. Targeting Kingfish, Sailfish, Dorado, Tuna and Giant Trevally.',
  alternates: {
    canonical: 'https://uaeangler.com/charters',
  },
};

export const revalidate = 300;

const COAST_COLOUR: Record<string, string> = {
  'Persian Gulf': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Gulf of Oman': 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  Both: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const TIPS = [
  {
    icon: Clock,
    title: 'Book Early',
    desc: 'Good charters fill up fast, especially October–March. Book at least a week in advance for weekends.',
  },
  {
    icon: Fish,
    title: 'Ask About Bait',
    desc: 'Confirm whether live bait, lures, and jigging gear are included. Some operators charge extra.',
  },
  {
    icon: Shield,
    title: 'Check Licences',
    desc: 'All commercial fishing vessels in UAE must hold a MOCCAE commercial fishing licence. Ask to see it.',
  },
  {
    icon: Users,
    title: 'Group Discounts',
    desc: 'Most operators offer 10–15% discount for full-boat bookings (don\'t share with strangers).',
  },
];

export default async function ChartersPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: charters } = await supabase
    .from('charters')
    .select('*')
    .order('is_verified', { ascending: false })
    .order('rating', { ascending: false, nullsFirst: false });

  return (
    <div className="min-h-screen pb-20">
      {/* Hero */}
      <section
        className="relative pt-28 pb-16 px-4 overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at 60% 0%, rgba(0,160,210,0.14) 0%, transparent 55%), #0a0f1a',
        }}
      >
        <div className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }} />
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/25 rounded-full px-4 py-1.5 text-teal-400 text-sm mb-6">
            <Anchor className="w-4 h-4" />
            Fishing Charters UAE
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
            Book a Charter.<br />
            <span className="text-teal-400">Fish UAE Waters Properly.</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mb-8 leading-relaxed">
            From Dubai Marina inshore trips to Dibba pelagic blue-water runs — find the right
            charter for your target species, experience level and budget.
          </p>

          <div className="flex flex-wrap gap-3">
            <a href="#charters"
              className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-bold px-6 py-3 rounded-xl transition-colors">
              Browse Charters
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link href="/spots"
              className="inline-flex items-center gap-2 border border-white/20 hover:border-teal-500/40 text-gray-300 hover:text-white font-semibold px-6 py-3 rounded-xl transition-colors">
              <MapPin className="w-4 h-4" />
              View Fishing Spots
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4">

        {/* Two coastlines callout */}
        <section className="py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Waves className="w-5 h-5 text-blue-400" />
                <h2 className="font-bold text-white">Persian Gulf</h2>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-3">
                Calmer, shallower waters. Best for Hammour, Zubaidi, Shari and bottom fishing on
                reef structure. Key ports: Dubai Marina, Abu Dhabi, RAK.
              </p>
              <p className="text-xs text-blue-400">Dubai · Abu Dhabi · Sharjah · RAK · UAQ · Ajman</p>
            </div>
            <div className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Waves className="w-5 h-5 text-teal-400" />
                <h2 className="font-bold text-white">Gulf of Oman</h2>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-3">
                Deeper, richer, cooler water. The pelagic hunting ground — Dorado, Sailfish,
                Yellowfin Tuna, Wahoo, Giant Trevally. Key ports: Fujairah, Dibba, Khor Fakkan.
              </p>
              <p className="text-xs text-teal-400">Fujairah · Dibba · Khor Fakkan · Kalba</p>
            </div>
          </div>
        </section>

        {/* Charter listings */}
        <section id="charters" className="pb-16">
          <div className="mb-8">
            <p className="text-teal-400 text-xs font-semibold uppercase tracking-[0.2em] mb-2">Available Charters</p>
            <h2 className="text-3xl font-extrabold text-white">Fishing Trips Across the UAE</h2>
          </div>

          {(!charters || charters.length === 0) ? (
            <div className="text-center py-16 text-gray-500">
              <Anchor className="w-10 h-10 mx-auto mb-4 opacity-20" />
              <p>No charters listed yet.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {charters.map((c) => (
                <div key={c.id}
                  className="rounded-2xl border border-white/10 bg-white/5 hover:border-teal-500/30 transition-all overflow-hidden">
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${COAST_COLOUR[c.coast] || COAST_COLOUR['Both']}`}>
                            {c.coast}
                          </span>
                          {(c.charter_type || []).map((t: string) => (
                            <span key={t} className="text-xs text-gray-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                              {t}
                            </span>
                          ))}
                          {c.is_verified && (
                            <span className="text-xs text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                        <Link href={`/charters/${c.slug}`}>
                          <h3 className="text-lg font-bold text-white mt-1 hover:text-teal-400 transition-colors">{c.name}</h3>
                        </Link>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {c.location}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-500 mb-0.5">From</p>
                        <p className="text-xl font-extrabold text-teal-400">AED {c.price_aed?.toLocaleString()}</p>
                        <p className="text-xs text-gray-600">per trip</p>
                        <div className="flex items-center gap-1 justify-end mt-1">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span className="text-xs text-gray-400">{c.rating}</span>
                        </div>
                      </div>
                    </div>

                    {/* Specs row */}
                    <div className="flex flex-wrap gap-5 mb-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-teal-500" />{c.duration}</span>
                      <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-teal-500" />Up to {c.capacity} anglers</span>
                    </div>

                    {/* Target species */}
                    <div className="mb-4">
                      <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Target Species</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(c.target_species || []).map((s: string) => (
                          <span key={s} className="text-xs text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Fish className="w-2.5 h-2.5" />
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Highlights */}
                    <ul className="space-y-1 mb-5">
                      {(c.highlights || []).map((h: string) => (
                        <li key={h} className="text-sm text-gray-400 flex items-start gap-2">
                          <span className="text-teal-500 mt-0.5 shrink-0">✓</span>
                          {h}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`mailto:info@uaeangler.com?subject=Charter Enquiry — ${c.name}`}
                        className="inline-flex items-center gap-2 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 hover:border-teal-400 text-teal-400 hover:text-teal-300 font-semibold px-4 py-2 rounded-xl text-sm transition-all"
                      >
                        <Phone className="w-4 h-4" />
                        Enquire via UAE Anglers Hub
                        <ChevronRight className="w-3.5 h-3.5" />
                      </a>
                      <Link
                        href={`/charters/${c.slug}`}
                        className="inline-flex items-center gap-2 border border-white/10 hover:border-white/30 text-gray-400 hover:text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Tips section */}
        <section className="pb-16">
          <h2 className="text-2xl font-extrabold text-white mb-6">Before You Book</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TIPS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 p-5 rounded-xl bg-white/5 border border-white/10">
                <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-teal-400" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm mb-1">{title}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* List your charter CTA */}
        <section className="pb-16">
          <div className="rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-900/20 to-[#040d1a] p-8 text-center">
            <Anchor className="w-8 h-8 text-teal-400 mx-auto mb-4" />
            <h2 className="text-xl font-extrabold text-white mb-2">Run a Charter Business?</h2>
            <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
              Get your charter listed here and in front of thousands of UAE anglers actively
              looking to book. Verified operators get a badge and priority placement.
            </p>
            <Link
              href="/advertise"
              className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              List Your Charter
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Related links */}
        <div className="flex flex-wrap justify-center gap-4 text-sm pb-4">
          <Link href="/spots" className="text-gray-500 hover:text-teal-400 transition-colors">Fishing Spots</Link>
          <Link href="/species" className="text-gray-500 hover:text-teal-400 transition-colors">Species Guide</Link>
          <Link href="/regulations" className="text-gray-500 hover:text-teal-400 transition-colors">Regulations</Link>
          <Link href="/weather" className="text-gray-500 hover:text-teal-400 transition-colors">Weather & Tides</Link>
        </div>
      </div>
    </div>
  );
}
