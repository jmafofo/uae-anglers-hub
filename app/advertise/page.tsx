import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Building2,
  Globe,
  BadgeCheck,
  BarChart3,
  ShoppingBag,
  Trophy,
  MessageCircle,
  Mail,
  Users,
  MapPin,
  Fish,
  Anchor,
  ArrowRight,
} from 'lucide-react';
import AdSlotsShowcase from '@/components/AdSlotsShowcase';

export const metadata: Metadata = {
  title: 'Partner with UAE Anglers Hub',
  description:
    'Collaborate with the UAE\'s largest fishing community. Reach passionate anglers across all 7 Emirates.',
};

const STATS = [
  { value: '10,000+', label: 'Active anglers' },
  { value: '53', label: 'Fishing spot pages' },
  { value: '98', label: 'UAE fish species' },
  { value: 'UAE-wide', label: 'Coverage across all 7 emirates' },
];

const WHY_PARTNER = [
  {
    icon: Globe,
    title: 'SEO-first platform',
    desc: 'Every page is built for Google — your brand gets organic search exposure alongside ours.',
  },
  {
    icon: BadgeCheck,
    title: 'Trusted community',
    desc: 'Anglers trust brands that authentically support their community, not interrupt it.',
  },
  {
    icon: BarChart3,
    title: 'Real engagement',
    desc: 'Our audience is actively researching gear, planning trips and comparing products.',
  },
  {
    icon: ShoppingBag,
    title: 'In-market audience',
    desc: 'Reach anglers at the exact moment they are making purchase decisions.',
  },
  {
    icon: Trophy,
    title: 'Tournament alignment',
    desc: 'Align your brand with competitions and events that anglers care about.',
  },
  {
    icon: MessageCircle,
    title: 'Community-first',
    desc: 'Authentic engagement — not banner blindness. Be part of the conversation.',
  },
];

export default function PartnerPage() {
  return (
    <div className="min-h-screen pt-20 pb-24 px-4">
      {/* ── Hero ── */}
      <section className="max-w-4xl mx-auto text-center py-16">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-full px-3 py-1 mb-6">
          <Building2 className="w-3 h-3" /> Partnerships
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-5">
          Partner with the UAE&apos;s <br className="hidden sm:block" />
          <span className="text-teal-400">Largest Fishing Community</span>
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
          UAE Anglers Hub is where UAE anglers discover spots, track catches, research species and connect with fellow anglers.
          If your brand serves the fishing community, let&apos;s talk.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="mailto:info@uaeangler.com?subject=Partnership Enquiry"
            className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            <Mail className="w-4 h-4" />
            Get in Touch
          </a>
          <a
            href="#why-partner"
            className="inline-flex items-center gap-2 border border-white/20 hover:border-teal-500/40 text-gray-300 hover:text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="max-w-4xl mx-auto mb-24">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map(({ value, label }) => (
            <div key={label} className="rounded-xl bg-white/5 border border-white/10 p-5 text-center">
              <p className="text-2xl font-extrabold text-teal-400 mb-1">{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why partner ── */}
      <section id="why-partner" className="max-w-4xl mx-auto mb-24">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-white mb-3">Why Partner With Us?</h2>
          <p className="text-gray-400 max-w-xl mx-auto text-sm">
            We work with brands that genuinely care about the UAE fishing community.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {WHY_PARTNER.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4 rounded-xl bg-white/5 border border-white/10 p-5">
              <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-teal-400" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm mb-1">{title}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Ad Placements / Media Kit ── */}
      <section className="max-w-5xl mx-auto mb-24">
        <AdSlotsShowcase />
      </section>

      {/* ── Contact CTA ── */}
      <section className="max-w-2xl mx-auto text-center mb-24">
        <div className="rounded-2xl bg-gradient-to-br from-teal-500/10 to-teal-900/10 border border-teal-500/20 p-10">
          <h2 className="text-2xl font-extrabold text-white mb-3">Interested in partnering?</h2>
          <p className="text-gray-400 text-sm mb-6">
            For more details, contact us and we&apos;ll get back to you with partnership opportunities.
          </p>
          <a
            href="mailto:info@uaeangler.com?subject=Partnership Enquiry"
            className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-bold px-7 py-3.5 rounded-xl transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Email info@uaeangler.com
          </a>
          <p className="text-xs text-gray-600 mt-4">We reply within 4 business hours.</p>
        </div>
      </section>

      {/* ── Charters ── */}
      <section className="max-w-4xl mx-auto mb-24">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-white mb-3">Fishing Charters</h2>
          <p className="text-gray-400 max-w-xl mx-auto text-sm">
            Operating a fishing charter in the UAE? List your services and get discovered by thousands of active anglers planning their next trip.
          </p>
        </div>
        <div className="rounded-2xl bg-white/5 border border-white/10 p-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-14 h-14 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
            <Anchor className="w-7 h-7 text-teal-400" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-lg font-bold text-white mb-1">List Your Charter</h3>
            <p className="text-sm text-gray-400">
              Get featured on our charters page with your boat details, pricing, availability and contact info. Reach anglers actively looking to book trips.
            </p>
          </div>
          <Link
            href="/charters"
            className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shrink-0"
          >
            View Charters <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Internal links ── */}
      <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-4 text-sm">
        <Link href="/shop" className="text-gray-500 hover:text-teal-400 transition-colors">Gear Marketplace</Link>
        <Link href="/spots" className="text-gray-500 hover:text-teal-400 transition-colors">Fishing Spots</Link>
        <Link href="/tournaments" className="text-gray-500 hover:text-teal-400 transition-colors">Tournaments</Link>
        <Link href="/species" className="text-gray-500 hover:text-teal-400 transition-colors">Fish Species</Link>
        <Link href="/charters" className="text-gray-500 hover:text-teal-400 transition-colors">Charters</Link>
      </div>
    </div>
  );
}
