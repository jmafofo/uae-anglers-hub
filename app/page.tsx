import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin, Fish, Users, Anchor, Bot, Trophy, ShieldCheck,
  ChevronRight, Microscope, Waves, Smartphone, ArrowRight,
  FlaskConical, Database,
} from 'lucide-react';
import { fishingSpots, emirates } from '@/lib/spots';
import { fishSpecies } from '@/lib/species';
import speciesPhotos from '@/lib/species-photos.json';

export default function HomePage() {
  const spotCount   = fishingSpots.length;
  const speciesCount = fishSpecies.length;

  // Pick species that have real photos for the showcase
  const photoSpecies = fishSpecies
    .filter((s) => (speciesPhotos as Record<string, string[]>)[s.slug]?.[0])
    .slice(0, 6);

  // Featured spots — priority picks
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
          HERO — full-viewport, multi-layer depth
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-14 overflow-hidden">

        {/* Deep ocean layered background */}
        <div className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 120% 70% at 50% 110%, rgba(0,210,170,0.18) 0%, transparent 60%),
              radial-gradient(ellipse 80% 50% at 85% 20%, rgba(0,120,255,0.10) 0%, transparent 55%),
              radial-gradient(ellipse 60% 40% at 10% 70%, rgba(0,180,200,0.08) 0%, transparent 50%),
              linear-gradient(180deg, #060d18 0%, #080f1e 50%, #05111a 100%)
            `,
          }}
        />

        {/* Animated sonar rings */}
        <div className="absolute inset-0 flex items-end justify-center pointer-events-none overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="absolute rounded-full border border-teal-400/10"
              style={{
                width: `${i * 26}vw`,
                height: `${i * 26}vw`,
                bottom: `-${i * 13}vw`,
                animationName: 'pulse',
                animationDuration: `${3 + i * 0.8}s`,
                animationTimingFunction: 'ease-out',
                animationIterationCount: 'infinite',
                animationDelay: `${i * 0.4}s`,
              }}
            />
          ))}
        </div>

        {/* Floating data particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[
            { left: '12%', top: '22%', text: 'Hammour ●' },
            { left: '78%', top: '30%', text: 'Lat 25.2° N ●' },
            { left: '88%', top: '65%', text: 'Cobia ●' },
            { left: '6%',  top: '58%', text: 'GPS Logged ●' },
            { left: '60%', top: '18%', text: 'Sultan Ibrahim ●' },
            { left: '42%', top: '80%', text: '36 Species ●' },
          ].map(({ left, top, text }) => (
            <div
              key={text}
              className="absolute text-teal-500/20 text-xs font-mono hidden lg:block"
              style={{ left, top }}
            >
              {text}
            </div>
          ))}
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Dual badge */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <span className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 rounded-full px-4 py-1.5 text-teal-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              UAE&apos;s Premier Angling Community
            </span>
            <span className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-1.5 text-blue-400 text-xs font-medium">
              <Microscope className="w-3.5 h-3.5" />
              MOCCAE Citizen Science Partner
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black tracking-tight leading-[0.9] text-white mb-6">
            Built for{' '}
            <span className="relative inline-block">
              <span className="text-teal-400">Anglers.</span>
            </span>
            <br />
            <span className="text-3xl sm:text-4xl lg:text-5xl font-light text-gray-300 tracking-wide">
              Powered by
            </span>{' '}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Science.
            </span>
          </h1>

          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            {spotCount} verified spots across all 7 Emirates. Log catches that feed real UAE marine research.
            The water doesn&apos;t just hold fish — it holds data.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link
              href="/spots"
              className="group flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-8 py-3.5 rounded-xl font-bold text-sm transition-all hover:shadow-[0_0_30px_rgba(20,184,166,0.4)] hover:-translate-y-0.5"
            >
              <MapPin className="w-4 h-4" />
              Explore Fishing Spots
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/species"
              className="flex items-center gap-2 border border-white/20 hover:border-teal-500/50 text-gray-300 hover:text-white px-8 py-3.5 rounded-xl font-semibold text-sm transition-all"
            >
              <Fish className="w-4 h-4" />
              UAE Fish Species Guide
            </Link>
          </div>

          {/* Live stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/10 rounded-2xl overflow-hidden border border-white/10">
            {[
              { value: spotCount.toString(), label: 'Verified Spots', icon: MapPin },
              { value: speciesCount.toString(), label: 'Documented Species', icon: Fish },
              { value: '7',  label: 'Emirates Covered', icon: Anchor },
              { value: '2',  label: 'Coastlines Mapped', icon: Waves },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label} className="bg-[#080f1e] px-5 py-4 flex flex-col items-center text-center">
                <Icon className="w-4 h-4 text-teal-400 mb-1.5" />
                <span className="text-2xl sm:text-3xl font-black text-white">{value}</span>
                <span className="text-gray-500 text-xs mt-0.5">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-gray-600 text-xs">
          <span className="tracking-widest uppercase text-[10px]">Scroll</span>
          <div className="w-px h-10 bg-gradient-to-b from-teal-500/50 to-transparent" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          DUAL IDENTITY — Angler + Scientist
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-[#07111e]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-teal-400 text-xs font-semibold uppercase tracking-[0.2em] mb-3">Two Worlds. One Platform.</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Every cast counts twice
            </h2>
            <p className="text-gray-400 mt-3 max-w-xl mx-auto">
              Your catch data directly feeds UAE marine biodiversity research. You&apos;re not just fishing — you&apos;re building the most comprehensive record of UAE coastal fish populations ever created.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Angler card */}
            <div className="relative rounded-2xl overflow-hidden border border-teal-500/20 bg-gradient-to-br from-teal-950/60 to-[#07111e] p-8">
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-teal-500/5 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="w-12 h-12 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center mb-6">
                <Anchor className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">For Anglers</h3>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Discover the best spots on both UAE coastlines, get AI-powered bait and timing advice, log your catches, compete in tournaments, and connect with the UAE fishing community.
              </p>
              <ul className="space-y-2.5 mb-8">
                {[
                  `${spotCount} GPS-verified fishing spots`,
                  'Live weather, tides & fishing score',
                  'AI fishing assistant & species ID',
                  'Tournaments with live leaderboards',
                  'Community forum & tackle shop',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-gray-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/spots" className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors">
                Explore Spots <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Science card */}
            <div className="relative rounded-2xl overflow-hidden border border-blue-500/20 bg-gradient-to-br from-blue-950/40 to-[#07111e] p-8">
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-blue-500/5 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center mb-6">
                <FlaskConical className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">For Science</h3>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Every logged catch — species, weight, GPS location, depth, season — becomes a verified data point in the UAE&apos;s first community-driven marine biodiversity database, supporting MOCCAE research goals.
              </p>
              <ul className="space-y-2.5 mb-8">
                {[
                  `${speciesCount} species from MOCCAE 2023 official list`,
                  'Persian Gulf & Gulf of Oman coverage',
                  'Georeferenced catch data by emirate',
                  'Conservation status & seasonal tracking',
                  'MOCCAE marine genomics partnership',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-gray-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/research" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors">
                View Research <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SPECIES SHOWCASE — real photos
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-teal-400 text-xs font-semibold uppercase tracking-[0.2em] mb-2">Marine Biodiversity</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">UAE Fish Species</h2>
              <p className="text-gray-400 mt-2">
                {speciesCount} species documented — Persian Gulf & Gulf of Oman
              </p>
            </div>
            <Link href="/species" className="inline-flex items-center gap-1.5 text-teal-400 hover:text-teal-300 font-semibold text-sm transition-colors whitespace-nowrap">
              Full species guide <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {photoSpecies.map((species) => {
              const photo = (speciesPhotos as Record<string, string[]>)[species.slug][0];
              return (
                <Link
                  key={species.slug}
                  href={`/species/${species.slug}`}
                  className="group relative rounded-xl overflow-hidden aspect-square bg-white/5 border border-white/10 hover:border-teal-500/50 transition-all hover:scale-[1.03]"
                >
                  <Image
                    src={photo}
                    alt={species.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2.5">
                    <p className="text-white text-xs font-semibold leading-tight">{species.name}</p>
                    <p className="text-gray-400 text-[10px] italic leading-tight">{species.scientificName}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Coast breakdown callout */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                <Waves className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Persian Gulf Coast</p>
                <p className="text-gray-400 text-xs">Abu Dhabi · Dubai · Sharjah · Ajman · UAQ · RAK</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <Waves className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Gulf of Oman Coast</p>
                <p className="text-gray-400 text-xs">Fujairah · Khor Fakkan · Dibba · East Sharjah</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FEATURED SPOTS — premium cards
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-[#07111e]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-teal-400 text-xs font-semibold uppercase tracking-[0.2em] mb-2">Where to Fish</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Featured Spots</h2>
              <p className="text-gray-400 mt-2">{spotCount} verified locations · updated regularly</p>
            </div>
            <Link href="/spots" className="inline-flex items-center gap-1.5 text-teal-400 hover:text-teal-300 font-semibold text-sm transition-colors whitespace-nowrap">
              View all {spotCount} spots <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredSpots.map((spot) => (
              <Link
                key={spot.id}
                href={`/spots/${spot.slug}`}
                className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-teal-500/40 bg-white/5 hover:bg-white/8 transition-all p-5"
              >
                {/* Emirate tag */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-teal-400 font-medium bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-full">
                    {spot.emirate}
                  </span>
                  <span className="text-xs text-gray-500 bg-white/5 px-2.5 py-1 rounded-full">
                    {spot.accessType}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-teal-400 transition-colors mb-2">
                  {spot.name}
                </h3>

                <p className="text-gray-400 text-xs mb-4 line-clamp-1">
                  {typeof spot.species === 'string'
                    ? (spot.species as string).split(',').slice(0, 4).join(', ')
                    : spot.species.slice(0, 4).join(', ')}
                </p>

                <div className="flex items-center gap-1 text-gray-500 text-xs">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="line-clamp-1">{spot.bestTime}</span>
                </div>

                <div className="absolute bottom-5 right-5 w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center group-hover:bg-teal-500/20 transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 text-teal-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>

          {/* Emirates coverage */}
          <div className="mt-10 pt-10 border-t border-white/10">
            <p className="text-gray-500 text-xs text-center mb-5 uppercase tracking-widest">All 7 Emirates</p>
            <div className="flex flex-wrap justify-center gap-2">
              {emirates.map((emirate) => {
                const count = fishingSpots.filter((s) => s.emirate === emirate).length;
                return (
                  <Link
                    key={emirate}
                    href={`/spots?emirate=${encodeURIComponent(emirate)}`}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-teal-500/40 hover:text-teal-400 text-sm text-gray-400 transition-colors"
                  >
                    {emirate}
                    <span className="text-xs text-gray-600">{count}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SCIENCE CALLOUT — MOCCAE / citizen science
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 100% 80% at 50% 50%, rgba(0,80,180,0.12) 0%, transparent 70%),
              #060d18
            `,
          }}
        />
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-blue-400 text-xs font-semibold uppercase tracking-[0.2em] mb-4">Citizen Science</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6 leading-tight">
                Every catch is a<br />
                <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  scientific record
                </span>
              </h2>
              <p className="text-gray-400 leading-relaxed mb-6">
                UAE Anglers Hub is part of a community outreach initiative supporting the UAE Ministry of Climate Change &amp; Environment (MOCCAE) marine genomics research programme. Your catch logs — species, weight, GPS, season — build a real-time record of UAE fish population health.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  { icon: Database, text: 'Catch data georeferenced by emirate & coastline' },
                  { icon: ShieldCheck, text: 'Species status tracked against MOCCAE 2023 official list' },
                  { icon: Microscope, text: 'Seasonal & depth data informs stock assessment' },
                  { icon: Smartphone, text: 'Ocean Sentinel AI app for field species identification' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <p className="text-gray-300 text-sm">{text}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/research" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors">
                  Research Programme <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/conservation" className="inline-flex items-center gap-2 border border-white/20 hover:border-blue-500/40 text-gray-300 hover:text-white text-sm px-5 py-2.5 rounded-lg transition-colors">
                  Conservation Rules
                </Link>
              </div>
            </div>

            {/* Stats panel */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: speciesCount.toString(), label: 'Species on MOCCAE 2023 List', color: 'blue' },
                { value: spotCount.toString(), label: 'Georeferenced Fishing Spots', color: 'teal' },
                { value: '2', label: 'Coastlines — Gulf & Oman', color: 'cyan' },
                { value: '7', label: 'Emirates with Active Data', color: 'indigo' },
              ].map(({ value, label, color }) => (
                <div
                  key={label}
                  className={`p-5 rounded-2xl border bg-gradient-to-br ${
                    color === 'blue'   ? 'from-blue-950/60 to-[#07111e] border-blue-500/20' :
                    color === 'teal'   ? 'from-teal-950/60 to-[#07111e] border-teal-500/20' :
                    color === 'cyan'   ? 'from-cyan-950/60 to-[#07111e] border-cyan-500/20' :
                                        'from-indigo-950/60 to-[#07111e] border-indigo-500/20'
                  }`}
                >
                  <p className={`text-4xl font-black mb-1 ${
                    color === 'blue' ? 'text-blue-400' :
                    color === 'teal' ? 'text-teal-400' :
                    color === 'cyan' ? 'text-cyan-400' : 'text-indigo-400'
                  }`}>{value}</p>
                  <p className="text-gray-400 text-xs leading-snug">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          PLATFORM FEATURES
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-[#07111e]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-teal-400 text-xs font-semibold uppercase tracking-[0.2em] mb-3">The Platform</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Everything you need</h2>
            <p className="text-gray-400 mt-3 max-w-xl mx-auto">
              Built specifically for UAE waters, from mangrove creeks to offshore blue water.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: Bot,
                title: 'AI Fishing Assistant',
                desc: 'Real-time spot recommendations, bait advice, and optimal fishing windows powered by live weather and solunar data.',
                href: '/assistant',
                accent: 'teal',
              },
              {
                icon: Fish,
                title: 'Species Database',
                desc: `${speciesCount} UAE fish species from the MOCCAE 2023 official list — Arabic names, scientific names, habitat, edibility and conservation status.`,
                href: '/species',
                accent: 'teal',
              },
              {
                icon: Trophy,
                title: 'Tournaments',
                desc: 'Join or create fishing tournaments with live leaderboards, multiple scoring types, and organised prize tracking.',
                href: '/tournaments',
                accent: 'amber',
              },
              {
                icon: ShieldCheck,
                title: 'Conservation & Regulations',
                desc: 'UAE fishing licence requirements, protected species, closed seasons, and minimum size limits — all in one place.',
                href: '/conservation',
                accent: 'green',
              },
              {
                icon: Smartphone,
                title: 'Ocean Sentinel App',
                desc: 'AI-powered mobile fish identification app. Point your camera at a catch for an instant species ID — works offline.',
                href: '/ocean-sentinel',
                accent: 'blue',
              },
              {
                icon: Users,
                title: 'Community & Forum',
                desc: 'Connect with UAE anglers, share spots, post catches, discuss gear, and get advice from experienced local fishermen.',
                href: '/forum',
                accent: 'purple',
              },
            ].map(({ icon: Icon, title, desc, href, accent }) => (
              <Link
                key={title}
                href={href}
                className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-teal-500/30 hover:bg-white/8 transition-all"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                  accent === 'teal'   ? 'bg-teal-500/10 border border-teal-500/20' :
                  accent === 'blue'   ? 'bg-blue-500/10 border border-blue-500/20' :
                  accent === 'amber'  ? 'bg-amber-500/10 border border-amber-500/20' :
                  accent === 'green'  ? 'bg-green-500/10 border border-green-500/20' :
                  accent === 'purple' ? 'bg-purple-500/10 border border-purple-500/20' :
                                        'bg-white/5 border border-white/10'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    accent === 'teal'   ? 'text-teal-400' :
                    accent === 'blue'   ? 'text-blue-400' :
                    accent === 'amber'  ? 'text-amber-400' :
                    accent === 'green'  ? 'text-green-400' :
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
          FINAL CTA
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 50% 100%, rgba(0,180,150,0.15) 0%, transparent 60%),
              #060d18
            `,
          }}
        />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <p className="text-teal-400 text-xs font-semibold uppercase tracking-[0.2em] mb-4">Join the Community</p>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
            Start fishing smarter.<br />
            <span className="text-teal-400">Start fishing for science.</span>
          </h2>
          <p className="text-gray-400 mb-10 text-lg">
            Free premium access for the first 500 members. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="group flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-bold px-8 py-4 rounded-xl text-base transition-all hover:shadow-[0_0_40px_rgba(20,184,166,0.4)] hover:-translate-y-0.5"
            >
              Get Free Early Access
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/log-catch" className="flex items-center gap-2 border border-white/20 hover:border-white text-gray-300 hover:text-white font-semibold px-8 py-4 rounded-xl text-base transition-colors">
              <Fish className="w-5 h-5" />
              Log a Catch
            </Link>
          </div>
          <p className="text-gray-600 text-sm mt-6">
            Already a member?{' '}
            <Link href="/login" className="text-teal-400 hover:text-teal-300 transition-colors">Sign in</Link>
          </p>
        </div>
      </section>

    </div>
  );
}
