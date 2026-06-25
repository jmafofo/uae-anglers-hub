import Link from 'next/link';
import { Anchor, Mail, ShieldCheck, FlaskConical, Smartphone, Info } from 'lucide-react';
import { fishingSpots } from '@/lib/spots';

const footerLinks = {
  Platform: [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About Us' },
    { href: '/community', label: 'Community Hub' },
    { href: '/feed', label: 'Following Feed' },
    { href: '/forum', label: 'Forum' },
    { href: '/community/messages', label: 'Messages' },
    { href: '/catches', label: 'Catch Feed' },
    { href: '/tournaments', label: 'Tournaments' },
    { href: '/shop', label: 'Tackle Shop' },
    { href: '/charters', label: 'Fishing Charters' },
    { href: '/suggestions', label: 'Suggestions' },
    { href: '/settings', label: 'Settings' },
  ],
  Explore: [
    { href: '/spots', label: 'Fishing Spots' },
    { href: '/species', label: 'Fish Species' },
    { href: '/weather', label: 'Weather & Tides' },
    { href: '/regulations', label: 'Regulations' },
  ],
  'Legal & Trust': [
    { href: '/privacy-policy', label: 'Privacy Policy' },
    { href: '/terms-of-service', label: 'Terms of Service' },
    { href: '/editorial-policy', label: 'Editorial Policy' },
    { href: '/conservation', label: 'Conservation' },
    { href: '/research', label: 'Research' },
    { href: '/ocean-sentinel', label: 'Ocean Sentinel App' },
  ],
  Connect: [
    { href: '/contact', label: 'Contact Us' },
    { href: '/assistant', label: 'AI Assistant' },
  ],
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#060b14] border-t border-white/10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-white font-bold text-base mb-4">
              <Anchor className="w-5 h-5 text-teal-400" />
              UAE Anglers Hub
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              The UAE&apos;s premier shore fishing community. {fishingSpots.length} verified spots,
              citizen science data, and conservation resources across all 7 Emirates.
            </p>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">
              Built by anglers for anglers, we share accurate, locally verified
              fishing information to help everyone fish responsibly and protect
              UAE waters.
            </p>

            <Link
              href="https://uaeangler.com"
              className="inline-flex items-center gap-1.5 text-teal-400 hover:text-teal-300 text-sm transition-colors mb-4"
            >
              <Info className="w-3.5 h-3.5" />
              https://uaeangler.com
            </Link>

            {/* Contact */}
            <a
              href="mailto:info@uaeangler.com"
              className="flex items-center gap-2 text-gray-400 hover:text-teal-400 text-sm transition-colors"
            >
              <Mail className="w-4 h-4" />
              info@uaeangler.com
            </a>
          </div>

          {/* Nav columns */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-white text-xs font-semibold uppercase tracking-widest mb-4">
                {section}
              </h3>
              <ul className="space-y-2.5">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-xs text-center sm:text-left">
            © {year} UAE Anglers Hub · https://uaeangler.com · All rights reserved
          </p>
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-gray-500">
            <Link href="/privacy-policy" className="hover:text-teal-400 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="hover:text-teal-400 transition-colors">
              Terms of Service
            </Link>
            <Link href="/editorial-policy" className="hover:text-teal-400 transition-colors">
              Editorial Policy
            </Link>
            <Link href="/conservation" className="hover:text-teal-400 flex items-center gap-1 transition-colors">
              <ShieldCheck className="w-3.5 h-3.5" />
              Conservation
            </Link>
            <Link href="/research" className="hover:text-teal-400 flex items-center gap-1 transition-colors">
              <FlaskConical className="w-3.5 h-3.5" />
              Research
            </Link>
            <Link href="/ocean-sentinel" className="hover:text-teal-400 flex items-center gap-1 transition-colors">
              <Smartphone className="w-3.5 h-3.5" />
              Ocean Sentinel
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
