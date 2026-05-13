import Link from 'next/link';
import {
  MapPin, Fish, Anchor, Waves, Dna, ArrowRight,
} from 'lucide-react';

interface HeroSectionProps {
  spotCount: number;
  speciesCount: number;
}

export function HeroSection({ spotCount, speciesCount }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-14 overflow-hidden">

      {/* Multi-layer ocean depth background */}
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse 130% 80% at 50% 115%, rgba(0,212,170,0.32) 0%, transparent 60%),
          radial-gradient(ellipse 70% 50% at 90% 15%,  rgba(45,140,220,0.22) 0%, transparent 55%),
          radial-gradient(ellipse 50% 40% at 5%  75%,  rgba(0,180,210,0.16) 0%, transparent 50%),
          radial-gradient(ellipse 40% 30% at 60% 30%,  rgba(60,120,200,0.14) 0%, transparent 45%),
          linear-gradient(180deg, #0d1f33 0%, #102a44 35%, #0a2238 100%)
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
          {spotCount}+ verified spots across all 7 Emirates. The UAE&apos;s first
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
            <div key={label} className="bg-[#0a1828] px-5 py-4 flex flex-col items-center text-center">
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
  );
}
