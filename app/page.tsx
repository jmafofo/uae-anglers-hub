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

export default function HomePage() {
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
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-14 overflow-hidden">

        {/* Multi-layer ocean depth background */}
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(ellipse 130% 80% at 50% 115%, rgba(0,200,180,0.20) 0%, transparent 55%),
            radial-gradient(ellipse 70% 50% at 90% 15%,  rgba(0,100,220,0.12) 0%, transparent 50%),
            radial-gradient(ellipse 50% 40% at 5%  75%,  rgba(0,160,210,0.09) 0%, transparent 45%),
            radial-gradient(ellipse 40% 30% at 60% 30%,  rgba(0,80,180,0.07)  0%, transparent 40%),
            linear-gradient(180deg, #04091200 0%, #060e1c 30%, #041020 100%)
          `,
        }} />

        {/* Hex grid overlay — technical / science feel */}
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V17L28 1l28 16v33L28 66zm0 34L0 84V51l28-17 28 17v33L28 100z' fill='none' stroke='%2300d4aa' stroke-width='0.8'/%3E%3C/svg%3E")`,
          backgroundSize: '56px 100px',
        }} />

        {/* Animated sonar rings from ocean floor */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="absolute rounded-full border border-teal-400/8"
              style={{
                width: `${i * 22}vw`, height: `${i * 11}vw`,
                bottom: 0, left: '50%',
                transform: 'translateX(-50%)',
                animationName: 'ping',
                animationDuration: `${4 + i}s`,
                animationTimingFunction: 'ease-out',
                animationIterationCount: 'infinite',
                animationDelay: `${i * 0.6}s`,
              }}
            />
          ))}
        </div>

        {/* Floating science + angling data labels */}
        <div className="absolute inset-0 pointer-events-none select-none">
          {[
            { l: '8%',  t: '20%', txt: '● Epinephelus coioides',  c: 'text-teal-500/25'  },
            { l: '75%', t: '25%', txt: '● GPS: 25.2°N 55.4°E',    c: 'text-blue-400/20'  },
            { l: '82%', t: '58%', txt: '● Scomberoides commersonnianus', c: 'text-cyan-500/20' },
            { l: '5%',  t: '62%', txt: '● Depth: 12m',             c: 'text-teal-400/20'  },
            { l: '55%', t: '15%', txt: '● Rastrelliger kanagurta', c: 'text-blue-300/18'  },
            { l: '38%', t: '78%', txt: '● Season: Oct–Apr',        c: 'text-teal-500/20'  },
          ].map(({ l, t, txt, c }) => (
            <div key={txt} className={`absolute text-[11px] font-mono hidden lg:block ${c}`}
              style={{ left: l, top: t }}>
              {txt}
            </div>
          ))}
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">

          {/* Badges — no claimed partnerships */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <span className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 rounded-full px-4 py-1.5 text-teal-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              UAE&apos;s Premier Angling Community
            </span>
            <span className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-1.5 text-blue-400 text-xs font-medium">
              <Dna className="w-3.5 h-3.5" />
              Citizen Science for UAE Waters
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black tracking-tight leading-[0.88] text-white mb-6">
            Built for{' '}
            <span className="text-teal-400">Anglers.</span>
            <br />
            <span className="text-3xl sm:text-4xl lg:text-5xl font-light text-gray-300 tracking-normal">
              Designed for
            </span>{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-300 bg-clip-text text-transparent">
              the ocean.
            </span>
          </h1>

          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            {spotCount} verified spots across all 7 Emirates. The UAE&apos;s first
            community-powered coastal fish database — catch data that matters
            beyond the fishing line.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link href="/spots"
              className="group flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-8 py-3.5 rounded-xl font-bold text-sm transition-all hover:shadow-[0_0_32px_rgba(20,184,166,0.45)] hover:-translate-y-0.5">
              <MapPin className="w-4 h-4" />
              Explore Fishing Spots
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/species"
              className="flex items-center gap-2 border border-white/20 hover:border-teal-500/50 text-gray-300 hover:text-white px-8 py-3.5 rounded-xl font-semibold text-sm transition-all">
              <Fish className="w-4 h-4" />
              UAE Species Database
            </Link>
          </div>

          {/* Live stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/8 rounded-2xl overflow-hidden border border-white/10">
            {[
              { value: `${spotCount}`,    label: 'Verified Spots',       icon: MapPin    },
              { value: `${speciesCount}`, label: 'Documented Species',   icon: Fish      },
              { value: '7',               label: 'Emirates Covered',     icon: Anchor    },
              { value: '2',               label: 'Coastlines Mapped',    icon: Waves     },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label} className="bg-[#070d1a] px-5 py-4 flex flex-col items-center text-center">
                <Icon className="w-4 h-4 text-teal-400 mb-1.5" />
                <span className="text-2xl sm:text-3xl font-black text-white">{value}</span>
                <span className="text-gray-500 text-xs mt-0.5">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-gray-600 text-xs">
          <span className="tracking-[0.2em] uppercase text-[10px]">Scroll</span>
          <div className="w-px h-10 bg-gradient-to-b from-teal-500/50 to-transparent" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          THE MISSING LINK — science positioning (not partnership claim)
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 relative overflow-hidden bg-[#06101c]">
        {/* DNA helix accent — right edge */}
        <div className="absolute right-0 top-0 bottom-0 w-72 pointer-events-none hidden xl:block opacity-[0.06]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent, transparent 8px,
              rgba(0,200,180,1) 8px, rgba(0,200,180,1) 9px
            )`,
          }}
        />

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-xs font-semibold uppercase tracking-[0.25em] mb-3">The Data Gap</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-5">
              UAE marine science has researchers.<br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                It needs the data.
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
              Thousands of anglers fish UAE waters every week — but until now,
              none of their catch data has been systematically collected.
              UAE Anglers Hub bridges that gap: turning recreational fishing
              into structured, georeferenced marine biodiversity records.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            {[
              {
                icon: Database,
                color: 'teal',
                title: 'Structured catch records',
                desc: 'Every catch logged on uaeangler.com captures species (with scientific name), weight, GPS location, depth, bait, and season — the exact fields marine researchers need.',
              },
              {
                icon: Dna,
                color: 'blue',
                title: 'Species-level precision',
                desc: `${speciesCount} species mapped to the MOCCAE 2023 official list, covering both Persian Gulf and Gulf of Oman coastlines — with conservation status and habitat classification.`,
              },
              {
                icon: BarChart3,
                color: 'cyan',
                title: 'Population trend data',
                desc: 'Aggregate catch data by species, emirate, season, and depth — enabling detection of population shifts, range changes, and fishing pressure over time.',
              },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className={`p-6 rounded-2xl border bg-gradient-to-br ${
                color === 'teal' ? 'from-teal-950/50 to-[#06101c] border-teal-500/20' :
                color === 'blue' ? 'from-blue-950/50 to-[#06101c] border-blue-500/20' :
                                   'from-cyan-950/50 to-[#06101c] border-cyan-500/20'
              }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                  color === 'teal' ? 'bg-teal-500/10 border border-teal-500/20' :
                  color === 'blue' ? 'bg-blue-500/10 border border-blue-500/20' :
                                     'bg-cyan-500/10 border border-cyan-500/20'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    color === 'teal' ? 'text-teal-400' :
                    color === 'blue' ? 'text-blue-400' : 'text-cyan-400'
                  }`} />
                </div>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Pull quote */}
          <div className="relative p-8 rounded-2xl border border-blue-500/20 bg-blue-950/20 text-center max-w-3xl mx-auto">
            <div className="text-blue-400/30 text-7xl font-serif absolute -top-4 left-6 leading-none">&ldquo;</div>
            <p className="text-white text-lg sm:text-xl font-medium leading-relaxed relative z-10">
              The UAE has world-class marine genomics capability.
              What it lacks is a real-time, community-scale record
              of what is being caught, where, and when.
            </p>
            <p className="text-gray-500 text-sm mt-4">
              That is what UAE Anglers Hub is building.
            </p>
            <div className="flex items-center justify-center gap-4 mt-6 flex-wrap">
              <Link href="/research"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
                Research Vision <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/conservation"
                className="inline-flex items-center gap-2 border border-white/15 hover:border-blue-400/40 text-gray-400 hover:text-white text-sm px-5 py-2.5 rounded-lg transition-colors">
                UAE Conservation Rules
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          DUAL IDENTITY — Angler + Science
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-teal-400 text-xs font-semibold uppercase tracking-[0.2em] mb-3">Two Worlds. One Platform.</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Every cast counts twice</h2>
            <p className="text-gray-400 mt-3 max-w-xl mx-auto">
              You fish. The data lives on. Every catch logged is a permanent record
              of UAE coastal marine life — useful now, invaluable in ten years.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Angler card */}
            <div className="relative rounded-2xl overflow-hidden border border-teal-500/20 bg-gradient-to-br from-teal-950/60 to-[#070d1a] p-8">
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-teal-500/5 pointer-events-none" />
              <div className="w-12 h-12 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center mb-6">
                <Anchor className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">For Anglers</h3>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Find the best spots on both UAE coastlines, get AI bait and timing
                advice, log your catches, join tournaments, and connect with the
                UAE fishing community.
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
              <Link href="/spots"
                className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors">
                Explore Spots <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Science card */}
            <div className="relative rounded-2xl overflow-hidden border border-blue-500/20 bg-gradient-to-br from-blue-950/40 to-[#070d1a] p-8">
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-blue-500/5 pointer-events-none" />
              <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center mb-6">
                <FlaskConical className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">For Marine Science</h3>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Each logged catch — species, weight, GPS location, depth, season —
                becomes a verified data point in the UAE&apos;s first community-driven
                coastal fish dataset, aligned with UAE marine conservation goals.
              </p>
              <ul className="space-y-2.5 mb-8">
                {[
                  `${speciesCount} species aligned with MOCCAE 2023 official list`,
                  'Persian Gulf & Gulf of Oman coverage',
                  'Georeferenced catch data by emirate',
                  'Conservation status & seasonal tracking',
                  'Ocean Sentinel mobile species ID app',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-gray-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/research"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors">
                Research Vision <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SPECIES SHOWCASE
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-[#06101c]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-teal-400 text-xs font-semibold uppercase tracking-[0.2em] mb-2">Marine Biodiversity</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">UAE Fish Species</h2>
              <p className="text-gray-400 mt-2">
                {speciesCount} species documented — Persian Gulf &amp; Gulf of Oman
              </p>
            </div>
            <Link href="/species"
              className="inline-flex items-center gap-1.5 text-teal-400 hover:text-teal-300 font-semibold text-sm whitespace-nowrap transition-colors">
              Full species guide <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {photoSpecies.map((species) => {
              const photo = (speciesPhotos as Record<string, string[]>)[species.slug][0];
              return (
                <Link key={species.slug} href={`/species/${species.slug}`}
                  className="group relative rounded-xl overflow-hidden aspect-square bg-white/5 border border-white/10 hover:border-teal-500/50 transition-all hover:scale-[1.04]">
                  <Image src={photo} alt={species.name} fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2.5">
                    <p className="text-white text-xs font-semibold leading-tight">{species.name}</p>
                    <p className="text-gray-400 text-[10px] italic">{species.scientificName}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Two coastlines */}
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
          FEATURED SPOTS
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-teal-400 text-xs font-semibold uppercase tracking-[0.2em] mb-2">Where to Fish</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Featured Spots</h2>
              <p className="text-gray-400 mt-2">{spotCount} verified locations · updated regularly</p>
            </div>
            <Link href="/spots"
              className="inline-flex items-center gap-1.5 text-teal-400 hover:text-teal-300 font-semibold text-sm whitespace-nowrap transition-colors">
              View all {spotCount} spots <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredSpots.map((spot) => (
              <Link key={spot.id} href={`/spots/${spot.slug}`}
                className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-teal-500/40 bg-white/5 hover:bg-white/8 transition-all p-5">
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

          <div className="mt-10 pt-10 border-t border-white/10">
            <p className="text-gray-500 text-xs text-center mb-5 uppercase tracking-widest">All 7 Emirates</p>
            <div className="flex flex-wrap justify-center gap-2">
              {emirates.map((emirate) => {
                const count = fishingSpots.filter((s) => s.emirate === emirate).length;
                return (
                  <Link key={emirate}
                    href={`/spots?emirate=${encodeURIComponent(emirate)}`}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-teal-500/40 hover:text-teal-400 text-sm text-gray-400 transition-colors">
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
          PLATFORM FEATURES
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-[#06101c]">
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
          FINAL CTA
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-28 px-4 relative overflow-hidden">
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(ellipse 90% 70% at 50% 100%, rgba(0,180,150,0.16) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 20% 20%,  rgba(0,80,200,0.08)  0%, transparent 50%),
            #060d18
          `,
        }} />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <p className="text-teal-400 text-xs font-semibold uppercase tracking-[0.2em] mb-4">Join the Community</p>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
            Fish smarter.<br />
            <span className="text-teal-400">Leave a record that matters.</span>
          </h2>
          <p className="text-gray-400 mb-10 text-lg max-w-lg mx-auto">
            Free premium access for the first 500 members. Every catch you log
            helps build the UAE&apos;s marine future.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup"
              className="group flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-bold px-8 py-4 rounded-xl text-base transition-all hover:shadow-[0_0_40px_rgba(20,184,166,0.4)] hover:-translate-y-0.5">
              Get Free Early Access
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/log-catch"
              className="flex items-center gap-2 border border-white/20 hover:border-white text-gray-300 hover:text-white font-semibold px-8 py-4 rounded-xl text-base transition-colors">
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
