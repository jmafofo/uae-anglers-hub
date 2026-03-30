import Link from 'next/link';
import { MapPin, Fish, Users, Anchor, Bot, Trophy, Cloud, ShieldCheck, ChevronRight } from 'lucide-react';
import { fishingSpots, emirates } from '@/lib/spots';

export default function HomePage() {
  const spotCount = fishingSpots.length;

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── HERO ── */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-14"
        style={{
          background:
            'radial-gradient(ellipse at center top, rgba(0,180,150,0.12) 0%, transparent 60%), #0a0f1a',
        }}
      >
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 rounded-full px-4 py-1.5 text-teal-400 text-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            UAE&apos;s Premier Shore Fishing Community
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight text-white mb-6">
            Catch More.
            <br />
            Explore Smarter.
            <br />
            <span className="text-teal-400">Connect Deeper.</span>
          </h1>

          <p className="text-gray-400 text-lg sm:text-xl max-w-xl mx-auto mb-10">
            {spotCount}+ verified fishing spots across all 7 Emirates. AI-powered forecasts, catch logs,
            tournaments, and a community of passionate UAE anglers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link
              href="/spots"
              className="flex items-center gap-2 border border-white/30 hover:border-white text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Explore Spots
            </Link>
            <Link
              href="/signup"
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Get Early Access + Free Premium for First 500
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <p className="text-gray-500 text-sm">
            Join 4,200+ UAE anglers already catching more with uaeangler.com
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-600 text-xs">
          <span>Scroll to explore</span>
          <div className="w-px h-8 bg-gradient-to-b from-gray-600 to-transparent" />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-4 bg-[#0d1520]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-4">How It Works</h2>
          <p className="text-gray-400 text-center mb-14 max-w-xl mx-auto">
            Everything you need to fish smarter across the UAE, in one platform.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: MapPin,
                title: 'Discover Spots',
                desc: 'Access verified fishing locations with detailed maps and conditions',
              },
              {
                icon: Fish,
                title: 'Log Your Catch',
                desc: 'Track your fishing success and build your angler profile',
              },
              {
                icon: Users,
                title: 'Connect & Compete',
                desc: 'Join tournaments, share tips, and connect with fellow anglers',
              },
              {
                icon: Anchor,
                title: 'Take It Offshore',
                desc: 'Book charter trips and explore deep-sea fishing adventures',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex flex-col items-center text-center p-6 rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-teal-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FISHING SPOTS PREVIEW ── */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Top Fishing Spots</h2>
              <p className="text-gray-400">Verified locations across all 7 Emirates</p>
            </div>
            <Link
              href="/spots"
              className="hidden sm:flex items-center gap-1 text-teal-400 hover:text-teal-300 text-sm font-medium"
            >
              View all {spotCount} spots <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fishingSpots.slice(0, 6).map((spot) => (
              <Link
                key={spot.id}
                href={`/spots/${spot.slug}`}
                className="group p-5 rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/40 hover:bg-white/8 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-teal-400 transition-colors">
                      {spot.name}
                    </h3>
                    <p className="text-gray-500 text-xs mt-0.5">{spot.emirate}</p>
                  </div>
                  <span className="text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {spot.accessType}
                  </span>
                </div>
                <p className="text-gray-400 text-xs line-clamp-2">
                  {spot.species.slice(0, 4).join(', ')}
                  {spot.species.length > 4 && ` +${spot.species.length - 4} more`}
                </p>
                <div className="flex items-center gap-1 mt-3 text-gray-500 text-xs">
                  <MapPin className="w-3 h-3" />
                  {spot.access}
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8 sm:hidden">
            <Link
              href="/spots"
              className="inline-flex items-center gap-1 text-teal-400 text-sm font-medium"
            >
              View all {spotCount} spots <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── EMIRATES COVERAGE ── */}
      <section className="py-16 px-4 bg-[#0d1520]">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-3">All 7 Emirates Covered</h2>
          <p className="text-gray-400 mb-10">Fishing spots from every corner of the UAE</p>
          <div className="flex flex-wrap justify-center gap-3">
            {emirates.map((emirate) => {
              const count = fishingSpots.filter((s) => s.emirate === emirate).length;
              return (
                <Link
                  key={emirate}
                  href={`/spots?emirate=${encodeURIComponent(emirate)}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:border-teal-500/40 hover:text-teal-400 text-sm text-gray-300 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {emirate}
                  <span className="text-xs text-gray-500">{count}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-4">
            Everything an UAE Angler Needs
          </h2>
          <p className="text-gray-400 text-center mb-14 max-w-xl mx-auto">
            Built specifically for the UAE fishing community — from shore casting to deep-sea charters.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Bot,
                title: 'AI Fishing Assistant',
                desc: 'Get real-time spot recommendations, bait advice, and optimal fishing times powered by live weather and solunar data.',
              },
              {
                icon: Cloud,
                title: 'Weather & Conditions',
                desc: 'Live forecasts for all 7 Emirates — wind, tides, wave height, moon phase, and a fishing score out of 100.',
              },
              {
                icon: Trophy,
                title: 'Tournaments',
                desc: 'Join or create fishing tournaments with live leaderboards, multiple scoring types, and prize tracking.',
              },
              {
                icon: Fish,
                title: 'Catch Logging',
                desc: 'Log catches with species, weight, photo, bait, and conditions. AI identifies fish from your photos.',
              },
              {
                icon: Users,
                title: 'Community & Forums',
                desc: 'Follow anglers, post catches, discuss spots, and get tips from the UAE fishing community.',
              },
              {
                icon: ShieldCheck,
                title: 'Regulations',
                desc: 'Stay compliant with UAE fishing regulations, seasonal restrictions, size limits, and licensing requirements.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/30 transition-colors"
              >
                <Icon className="w-6 h-6 text-teal-400 mb-4" />
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-20 px-4 bg-gradient-to-br from-teal-900/40 to-[#0a0f1a] border-t border-teal-500/10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Join the UAE Fishing Community
          </h2>
          <p className="text-gray-400 mb-8">
            Free premium for the first 500 members. No credit card required.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors"
          >
            Get Free Early Access
            <ChevronRight className="w-5 h-5" />
          </Link>
          <p className="text-gray-600 text-sm mt-4">
            Already a member?{' '}
            <Link href="/login" className="text-teal-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#070b12] border-t border-white/10 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-500 text-sm">
          <div className="flex items-center gap-2">
            <Anchor className="w-4 h-4 text-teal-400" />
            <span className="text-white font-semibold">UAE Anglers Hub</span>
          </div>
          <p>© 2026 UAE Anglers Hub. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
