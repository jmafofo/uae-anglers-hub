import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CheckCircle2,
  Star,
  Zap,
  Building2,
  TrendingUp,
  Globe,
  BadgeCheck,
  ShoppingBag,
  MapPin,
  Trophy,
  BarChart3,
  MessageCircle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Advertise on UAE Anglers Hub — Reach 10,000+ UAE Anglers',
  description:
    'Promote your tackle shop, fishing brand or charter on the UAE\'s leading angling community. Verified retailer badges, featured listings, sponsored spot pages and more.',
};

const TIERS = [
  {
    name: 'Free',
    price: 'AED 0',
    period: '',
    description: 'Get listed and build your presence.',
    highlight: false,
    cta: 'Create Free Account',
    ctaHref: '/signup',
    features: [
      'Basic shop profile page',
      'Up to 5 product listings',
      'Standard marketplace placement',
      'WhatsApp contact button',
      'Community forum access',
    ],
    missing: [
      'Verified Retailer badge',
      'Priority listing placement',
      'Sponsored spot pages',
      'Analytics dashboard',
      'Featured homepage banner',
    ],
  },
  {
    name: 'Pro Retailer',
    price: 'AED 299',
    period: '/month',
    description: 'For growing tackle shops wanting real visibility.',
    highlight: true,
    cta: 'Start Pro — 14 Days Free',
    ctaHref: 'mailto:info@uaeangler.com?subject=Pro Retailer Subscription',
    features: [
      'Verified Retailer badge on all listings',
      'Up to 50 product listings',
      'Priority placement in marketplace search',
      'Dedicated shop profile page',
      'Analytics dashboard (views, clicks, leads)',
      'WhatsApp widget + click-to-chat',
      'Gear & Tackle forum pinned post (1/month)',
      'Email support',
    ],
    missing: [
      'Homepage featured banner',
      'Sponsored fishing spot pages',
      'Tournament sponsorship placement',
    ],
  },
  {
    name: 'Business',
    price: 'AED 799',
    period: '/month',
    description: 'For brands and multi-location retailers seeking full-platform presence.',
    highlight: false,
    cta: 'Contact Us',
    ctaHref: 'mailto:info@uaeangler.com?subject=Business Subscription Enquiry',
    features: [
      'Everything in Pro',
      'Homepage featured banner (rotating)',
      'Sponsor up to 3 fishing spot pages',
      'Tournament sponsorship placement',
      'Unlimited product listings',
      'Branded store page with custom header',
      'Priority customer support',
      'Quarterly performance report',
      'Co-marketing opportunities',
    ],
    missing: [],
  },
];

const BOOSTED_FEATURES = [
  {
    icon: TrendingUp,
    title: 'Top of search results',
    desc: 'Your listing appears above all standard listings for 7 days.',
  },
  {
    icon: Star,
    title: 'Boosted badge',
    desc: 'A prominent badge draws buyer attention instantly.',
  },
  {
    icon: Zap,
    title: 'Sell faster',
    desc: 'Boosted listings get 3–5× more views than standard ones.',
  },
];

const SPOT_SPONSORSHIP = [
  { icon: MapPin, label: 'Hameem Beach', emirate: 'Abu Dhabi' },
  { icon: MapPin, label: 'Khor Fakkan', emirate: 'Sharjah' },
  { icon: MapPin, label: 'Al Aqah', emirate: 'Fujairah' },
  { icon: MapPin, label: 'Mushrif Park', emirate: 'Dubai' },
  { icon: MapPin, label: 'Dibba', emirate: 'Fujairah' },
  { icon: MapPin, label: 'Umm Al Quwain Marina', emirate: 'UAQ' },
];

const STATS = [
  { value: '10,000+', label: 'Active anglers' },
  { value: '53', label: 'Fishing spot pages' },
  { value: '41', label: 'UAE fish species' },
  { value: 'UAE-wide', label: 'Coverage across all 7 emirates' },
];

export default function AdvertisePage() {
  return (
    <div className="min-h-screen pt-20 pb-24 px-4">
      {/* ── Hero ── */}
      <section className="max-w-4xl mx-auto text-center py-16">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-full px-3 py-1 mb-6">
          <Building2 className="w-3 h-3" /> For Businesses & Retailers
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-5">
          Reach UAE&apos;s Most Passionate <br className="hidden sm:block" />
          <span className="text-teal-400">Fishing Community</span>
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
          UAE Anglers Hub is where UAE anglers discover spots, track catches, research species and buy gear.
          Put your tackle shop, brand or charter in front of them — where the purchase decision happens.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="mailto:info@uaeangler.com?subject=Advertise Enquiry"
            className="bg-teal-500 hover:bg-teal-400 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Get in Touch
          </a>
          <a
            href="#pricing"
            className="border border-white/20 hover:border-teal-500/40 text-gray-300 hover:text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            See Pricing
          </a>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="max-w-4xl mx-auto mb-20">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map(({ value, label }) => (
            <div key={label} className="rounded-xl bg-white/5 border border-white/10 p-5 text-center">
              <p className="text-2xl font-extrabold text-teal-400 mb-1">{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing tiers ── */}
      <section id="pricing" className="max-w-5xl mx-auto mb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-white mb-3">Subscription Plans</h2>
          <p className="text-gray-400">Simple pricing. No hidden fees. Cancel anytime.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl border p-6 flex flex-col ${
                tier.highlight
                  ? 'border-teal-500 bg-teal-500/5 shadow-lg shadow-teal-500/10'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              {tier.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold bg-teal-500 text-white px-3 py-0.5 rounded-full">
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-bold text-white mb-1">{tier.name}</h3>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-3xl font-extrabold text-white">{tier.price}</span>
                {tier.period && <span className="text-gray-400 text-sm mb-1">{tier.period}</span>}
              </div>
              <p className="text-sm text-gray-400 mb-6">{tier.description}</p>

              <a
                href={tier.ctaHref}
                className={`w-full text-center py-3 rounded-xl font-bold text-sm mb-6 transition-colors ${
                  tier.highlight
                    ? 'bg-teal-500 hover:bg-teal-400 text-white'
                    : 'border border-white/20 hover:border-teal-500/40 text-gray-300 hover:text-white'
                }`}
              >
                {tier.cta}
              </a>

              <ul className="space-y-2.5 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
                {tier.missing.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600 line-through">
                    <CheckCircle2 className="w-4 h-4 text-gray-700 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          All prices in AED. VAT may apply. Subscriptions are billed monthly and can be cancelled anytime.{' '}
          <a href="mailto:info@uaeangler.com" className="text-teal-500 hover:underline">
            Contact us
          </a>{' '}
          for annual discount pricing.
        </p>
      </section>

      {/* ── Boosted Listings ── */}
      <section className="max-w-4xl mx-auto mb-24">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 sm:p-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Boost Any Listing</h2>
              <p className="text-xs text-gray-500">For individual anglers &amp; commercial sellers</p>
            </div>
            <span className="ml-auto text-2xl font-extrabold text-amber-400">AED 20</span>
          </div>
          <p className="text-gray-400 text-sm mb-8">
            Pin your gear listing to the top of the marketplace for 7 days. No subscription needed — pay per boost.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {BOOSTED_FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl bg-white/5 border border-white/10 p-4">
                <Icon className="w-5 h-5 text-amber-400 mb-2" />
                <p className="text-sm font-semibold text-white mb-1">{title}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
          <a
            href="mailto:info@uaeangler.com?subject=Boost a Listing"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-bold px-5 py-3 rounded-xl text-sm transition-colors"
          >
            <Zap className="w-4 h-4" /> Boost My Listing
          </a>
        </div>
      </section>

      {/* ── Sponsored Spot Pages ── */}
      <section className="max-w-4xl mx-auto mb-24">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-white mb-3">Sponsor a Fishing Spot</h2>
          <p className="text-gray-400 max-w-xl mx-auto text-sm">
            Each of our 53 fishing spot pages is a high-intent SEO page visited by anglers planning their next trip.
            Put your shop&apos;s logo and link right where the decision is made.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          {SPOT_SPONSORSHIP.map(({ icon: Icon, label, emirate }) => (
            <div key={label} className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-center gap-3">
              <Icon className="w-4 h-4 text-teal-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-xs text-gray-500">{emirate}</p>
              </div>
              <span className="ml-auto text-xs text-teal-400 font-semibold">AED 199/mo</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-500 text-center">
          + 47 more spots across all 7 emirates. Exclusive per spot — first come, first served.{' '}
          <a href="mailto:info@uaeangler.com?subject=Spot Sponsorship" className="text-teal-400 hover:underline">
            Enquire now
          </a>
        </p>
      </section>

      {/* ── Why advertise ── */}
      <section className="max-w-4xl mx-auto mb-24">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-white mb-3">Why UAE Anglers Hub?</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: Globe, title: 'SEO-first platform', desc: 'Every page is built for Google — your brand gets organic search exposure alongside ours.' },
            { icon: BadgeCheck, title: 'Verified Retailer badge', desc: 'Stand out from peer-to-peer sellers. Buyers trust verified commercial profiles.' },
            { icon: BarChart3, title: 'Real analytics', desc: 'See impressions, clicks, WhatsApp tap-throughs and listing views in your dashboard.' },
            { icon: ShoppingBag, title: 'In-market audience', desc: 'Anglers on this platform are actively researching gear, planning trips and comparing products.' },
            { icon: Trophy, title: 'Tournament sponsorship', desc: 'Align your brand with competitions and events that anglers care about.' },
            { icon: MessageCircle, title: 'Community-first', desc: 'Authentic engagement — not banner blindness. Anglers trust brands that support their community.' },
          ].map(({ icon: Icon, title, desc }) => (
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

      {/* ── CTA ── */}
      <section className="max-w-2xl mx-auto text-center">
        <div className="rounded-2xl bg-gradient-to-br from-teal-500/10 to-teal-900/10 border border-teal-500/20 p-10">
          <h2 className="text-2xl font-extrabold text-white mb-3">Ready to grow your business?</h2>
          <p className="text-gray-400 text-sm mb-6">
            Email us and we&apos;ll set up your retailer profile, verify your account and get you live within 24 hours.
          </p>
          <a
            href="mailto:info@uaeangler.com?subject=Advertise on UAE Anglers Hub"
            className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-bold px-7 py-3.5 rounded-xl transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Email info@uaeangler.com
          </a>
          <p className="text-xs text-gray-600 mt-4">We reply within 4 business hours.</p>
        </div>
      </section>

      {/* ── Internal links ── */}
      <div className="max-w-4xl mx-auto mt-16 flex flex-wrap justify-center gap-4 text-sm">
        <Link href="/shop" className="text-gray-500 hover:text-teal-400 transition-colors">Gear Marketplace</Link>
        <Link href="/spots" className="text-gray-500 hover:text-teal-400 transition-colors">Fishing Spots</Link>
        <Link href="/tournaments" className="text-gray-500 hover:text-teal-400 transition-colors">Tournaments</Link>
        <Link href="/species" className="text-gray-500 hover:text-teal-400 transition-colors">Fish Species</Link>
      </div>
    </div>
  );
}
