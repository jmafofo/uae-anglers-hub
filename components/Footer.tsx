import Link from 'next/link';
import { Anchor, Mail, MapPin, Fish, ShieldCheck, FlaskConical, Smartphone } from 'lucide-react';

const footerLinks = {
  Explore: [
    { href: '/spots',        label: 'Fishing Spots' },
    { href: '/species',      label: 'Fish Species' },
    { href: '/weather',      label: 'Weather & Tides' },
    { href: '/catches',      label: 'Catch Log' },
  ],
  Community: [
    { href: '/forum',        label: 'Forum' },
    { href: '/tournaments',  label: 'Tournaments' },
    { href: '/shop',         label: 'Tackle Shop' },
    { href: '/charters',     label: 'Boat Charters' },
  ],
  Learn: [
    { href: '/conservation', label: 'Conservation' },
    { href: '/research',     label: 'Research' },
    { href: '/ocean-sentinel', label: 'Ocean Sentinel App' },
    { href: '/assistant',    label: 'AI Assistant' },
  ],
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#060b14] border-t border-white/10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-white font-bold text-base mb-4">
              <Anchor className="w-5 h-5 text-teal-400" />
              UAE Anglers Hub
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              The UAE&apos;s premier shore fishing community. 45+ verified spots,
              citizen science data, and conservation resources across all 7 Emirates.
            </p>

            {/* Contact */}
            <a
              href="mailto:info@uaeangler.com"
              className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 text-sm transition-colors"
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
          <p className="text-gray-500 text-xs">
            © {year} UAE Anglers Hub · uaeangler.com · All rights reserved
          </p>
          <div className="flex items-center gap-5 text-xs text-gray-500">
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
