'use client';

import Link from 'next/link';
import { MapPin, MessagesSquare, Trophy, Waves } from 'lucide-react';
import FishSplashBackdrop from '@/components/FishSplashBackdrop';
import { GlassCard, SectionHeader } from '@/components/ui';

const FEATURED = [
  {
    slug: 'todays-conditions',
    name: "Today's Conditions",
    tagline: 'Live water, wind, and bite reports from across the UAE.',
    icon: Waves,
  },
  {
    slug: 'catch-and-brag',
    name: 'Catch & Brag',
    tagline: "Show off today's catch — photos, stories, close calls.",
    icon: Trophy,
  },
] as const;

const EMIRATE_LOUNGES = [
  { slug: 'abu-dhabi', name: 'Abu Dhabi', tagline: 'From Hameem to the Corniche.' },
  { slug: 'dubai', name: 'Dubai', tagline: 'Creek, marina, and coastline chat.' },
  { slug: 'sharjah', name: 'Sharjah', tagline: 'Lagoons, ports, and the Kalba run.' },
  { slug: 'ajman', name: 'Ajman', tagline: 'Marina, corniche, and Al Zorah.' },
  { slug: 'umm-al-quwain', name: 'Umm Al Quwain', tagline: 'Laid-back lagoons and mangroves.' },
  { slug: 'ras-al-khaimah', name: 'Ras Al Khaimah', tagline: 'Al Rams to offshore charters.' },
  { slug: 'fujairah', name: 'Fujairah', tagline: 'Gulf of Oman currents and big game.' },
] as const;

export default function LoungesClient() {
  return (
    <div className="min-h-screen bg-[#f7f9fa] text-[#182e3c]">
      {/* Hero with the animated water/fish backdrop */}
      <div className="relative overflow-hidden border-b border-[#e1e7eb] bg-white">
        <FishSplashBackdrop tone="light" />
        <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-20">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#27685f]">
            Community
          </p>
          <h1 className="mt-2 font-serif text-[clamp(2.4rem,4.5vw,3.8rem)] leading-[1.08] tracking-[-0.04em] text-[#15313f]">
            The loudest water <em className="not-italic text-[#367b70]">in the UAE</em>
          </h1>
          <p className="mt-4 max-w-xl leading-relaxed text-[#5b6b77]">
            Nine live lounges — one for every emirate, plus today&apos;s conditions and
            catch &amp; brag. Ask what&apos;s biting before you load the car.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-14">
        <SectionHeader eyebrow="Always on" title="Featured lounges" />
        <div className="grid gap-5 sm:grid-cols-2">
          {FEATURED.map((lounge) => (
            <Link key={lounge.slug} href={`/lounges/${lounge.slug}`} className="group">
              <GlassCard interactive className="flex h-full items-start gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e7f2ee] text-[#23675e] transition-colors group-hover:bg-[#23675e] group-hover:text-white">
                  <lounge.icon size={22} />
                </div>
                <div>
                  <h3 className="font-serif text-2xl tracking-[-0.02em] text-[#18333f]">
                    {lounge.name}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#5b6b77]">{lounge.tagline}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#23675e]">
                    <MessagesSquare size={14} />
                    Join the conversation
                  </span>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>

        <div className="mt-14">
          <SectionHeader eyebrow="Local talk" title="Emirate lounges" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EMIRATE_LOUNGES.map((lounge) => (
              <Link key={lounge.slug} href={`/lounges/${lounge.slug}`} className="group">
                <GlassCard interactive className="h-full p-5">
                  <div className="flex items-center gap-2.5">
                    <MapPin size={16} className="text-[#23675e]" />
                    <h3 className="font-serif text-xl tracking-[-0.02em] text-[#18333f]">
                      {lounge.name}
                    </h3>
                  </div>
                  <p className="mt-1.5 text-sm text-[#5b6b77]">{lounge.tagline}</p>
                </GlassCard>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
