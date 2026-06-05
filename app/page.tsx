import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin, Fish, Users, Anchor, Bot, Trophy, ShieldCheck,
  ChevronRight, Microscope, Waves, Smartphone, ArrowRight,
  FlaskConical, Database, Dna, BarChart3,
} from 'lucide-react';
import { fishingSpots, emirates } from '@/lib/spots';
import { fishSpecies } from '@/lib/species';
import speciesPhotos from '@/lib/species-photos.json';
import { TrendingNews } from '@/components/TrendingNews';
import { HeroSection } from './(home)/sections/HeroSection';
import { DataGapSection } from './(home)/sections/DataGapSection';
import { PlatformFeatures } from './(home)/sections/PlatformFeatures';
import { SpeciesShowcase } from './(home)/sections/SpeciesShowcase';
import { SpotsShowcase } from './(home)/sections/SpotsShowcase';
import { CTASection } from './(home)/sections/CTASection';
import GoogleAd from '@/components/GoogleAd';
import VisitorCounter from '@/components/VisitorCounter';

export const revalidate = 300;

export default async function HomePage() {
  const spotCount    = fishingSpots.length;
  const speciesCount = fishSpecies.length;

  // Species that have real photos for the showcase
  const photoSpecies = fishSpecies
    .filter((s) => (speciesPhotos as Record<string, string[]>)[s.slug]?.[0])
    .slice(0, 6);

  // Featured spots
  const featuredSpotSlugs = [
    'hameem-beach', 'fujairah-marine-club', 'khor-fakkan',
    'dibba', 'al-zorah-nature-reserve', 'al-hamra-marina',
  ];
  const featuredSpots = featuredSpotSlugs
    .map((slug) => fishingSpots.find((s) => s.slug === slug))
    .filter(Boolean) as typeof fishingSpots;

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      {/* ═══════════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════════ */}
      <HeroSection spotCount={spotCount} speciesCount={speciesCount} />

      {/* ═══════════════════════════════════════════════════════════
          GOOGLE AD — homepage leaderboard
      ═══════════════════════════════════════════════════════════ */}
      <section className="px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <GoogleAd format="leaderboard" slot={process.env.NEXT_PUBLIC_GOOGLE_ADS_SLOT_HOME} />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          TRENDING NEWS + SEASONAL BANS
      ═══════════════════════════════════════════════════════════ */}
      <TrendingNews />

      {/* ═══════════════════════════════════════════════════════════
          THE MISSING LINK — science positioning
      ═══════════════════════════════════════════════════════════ */}
      <DataGapSection speciesCount={speciesCount} />

      {/* ═══════════════════════════════════════════════════════════
          DUAL IDENTITY — Angler + Science
      ═══════════════════════════════════════════════════════════ */}
      <PlatformFeatures spotCount={spotCount} speciesCount={speciesCount} />

      {/* ═══════════════════════════════════════════════════════════
          SPECIES SHOWCASE
      ═══════════════════════════════════════════════════════════ */}
      <SpeciesShowcase photoSpecies={photoSpecies} speciesCount={speciesCount} />

      {/* ═══════════════════════════════════════════════════════════
          FEATURED SPOTS
      ═══════════════════════════════════════════════════════════ */}
      <SpotsShowcase featuredSpots={featuredSpots} spotCount={spotCount} />

      {/* ═══════════════════════════════════════════════════════════
          PLATFORM FEATURES
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-[#0d1f33]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-teal-400 text-xs font-semibold uppercase tracking-[0.2em] mb-3">The Platform</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Everything UAE anglers need</h2>
            <p className="text-gray-400 mt-3 max-w-xl mx-auto">
              From mangrove creeks to offshore blue water — built for UAE conditions, both coastlines.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Bot,          title: 'AI Fishing Assistant',    href: '/assistant',     accent: 'teal',   desc: 'Real-time spot recommendations, bait advice, and optimal windows powered by live weather and solunar data.' },
              { icon: Fish,         title: 'Species Database',         href: '/species',       accent: 'teal',   desc: `${speciesCount} UAE species from the MOCCAE 2023 official list — Arabic names, scientific names, habitat and conservation status.` },
              { icon: Trophy,       title: 'Tournaments',              href: '/tournaments',   accent: 'amber',  desc: 'Join or create fishing tournaments with live leaderboards, multiple scoring types, and prize tracking.' },
              { icon: ShieldCheck,  title: 'Conservation & Regulations', href: '/conservation', accent: 'green', desc: 'UAE fishing licence requirements, protected species, closed seasons, and minimum size limits.' },
              { icon: Smartphone,   title: 'Ocean Sentinel App',       href: '/ocean-sentinel', accent: 'blue',  desc: 'AI-powered mobile fish ID app — point your camera at a catch for an instant species identification. Works offline.' },
              { icon: Users,        title: 'Community & Forum',        href: '/forum',         accent: 'purple', desc: 'Connect with UAE anglers, share spots, post catches, discuss gear, and learn from experienced local fishermen.' },
            ].map(({ icon: Icon, title, desc, href, accent }) => (
              <Link key={title} href={href}
                className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-teal-500/30 hover:bg-white/8 transition-all">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 border ${
                  accent === 'teal'   ? 'bg-teal-500/10   border-teal-500/20'   :
                  accent === 'blue'   ? 'bg-blue-500/10   border-blue-500/20'   :
                  accent === 'amber'  ? 'bg-amber-500/10  border-amber-500/20'  :
                  accent === 'green'  ? 'bg-green-500/10  border-green-500/20'  :
                  accent === 'purple' ? 'bg-purple-500/10 border-purple-500/20' :
                                        'bg-white/5 border-white/10'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    accent === 'teal'   ? 'text-teal-400'   :
                    accent === 'blue'   ? 'text-blue-400'   :
                    accent === 'amber'  ? 'text-amber-400'  :
                    accent === 'green'  ? 'text-green-400'  :
                    accent === 'purple' ? 'text-purple-400' : 'text-gray-400'
                  }`} />
                </div>
                <h3 className="font-bold text-white group-hover:text-teal-400 transition-colors mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          OCEAN SENTINEL APP PROMO
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden border border-teal-500/20 bg-gradient-to-br from-[#061a2e] to-[#040d1a] p-8 sm:p-12">
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 60% 80% at 0% 50%, rgba(0,180,150,0.10) 0%, transparent 60%)' }} />
            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8">
              {/* Phone mock */}
              <div className="shrink-0 w-28 aspect-[9/19] rounded-3xl bg-gradient-to-b from-teal-900/80 to-[#0a0f1a] border border-white/15 flex flex-col items-center justify-center gap-2 p-3 shadow-2xl">
                <div className="w-6 h-1.5 rounded-full bg-white/20" />
                <div className="text-3xl mt-1">🐟</div>
                <div className="w-full space-y-1.5 mt-2">
                  <div className="h-2 bg-teal-400/25 rounded-full" />
                  <div className="h-1.5 bg-white/10 rounded-full w-4/5" />
                  <div className="h-1.5 bg-white/5 rounded-full w-2/3" />
                </div>
                <div className="w-full h-6 rounded-lg bg-teal-500/30 mt-auto flex items-center justify-center">
                  <span className="text-[9px] text-teal-300 font-semibold">IDENTIFY</span>
                </div>
              </div>

              {/* Copy */}
              <div className="flex-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/25 rounded-full px-3 py-1 text-yellow-400 text-xs mb-3">
                  <Smartphone className="w-3.5 h-3.5" />
                  Coming Soon
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
                  Ocean Sentinel App
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-xl">
                  Point your camera at any catch — AI identifies the species instantly. Works fully offline at sea.
                  Built on UAE waters, trained on the same{' '}{speciesCount} MOCCAE-verified species in this database.
                </p>
                <Link
                  href="/ocean-sentinel"
                  className="inline-flex items-center gap-2 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/40 hover:border-teal-400 text-teal-400 hover:text-teal-300 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
                >
                  <Smartphone className="w-4 h-4" />
                  Learn more & get notified
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Store badges */}
              <div className="shrink-0 flex flex-col gap-2 sm:gap-3">
                {[
                  { icon: '🍎', top: 'Download on the', bottom: 'App Store' },
                  { icon: '🤖', top: 'Get it on', bottom: 'Google Play' },
                ].map(({ icon, top, bottom }) => (
                  <Link key={bottom} href="/ocean-sentinel"
                    className="flex items-center gap-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl px-4 py-2.5 transition-all">
                    <span className="text-xl">{icon}</span>
                    <div>
                      <p className="text-[10px] text-gray-500 leading-none mb-0.5">{top}</p>
                      <p className="text-white font-bold text-xs">{bottom}</p>
                    </div>
                    <span className="ml-1 text-[9px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded-full">Soon</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════════════════════════ */}
      <CTASection />

      {/* ═══════════════════════════════════════════════════════════
          VISITOR COUNTER
      ═══════════════════════════════════════════════════════════ */}
      <VisitorCounter />

    </div>
  );
}
