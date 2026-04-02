'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  MapPin,
  Fish,
  Users,
  MessageSquare,
  Anchor,
  ShoppingBag,
  Bot,
  Menu,
  X,
  Plus,
  ShieldCheck,
  Beaker,
  BadgeCheck,
} from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Home', icon: null },
  { href: '/assistant', label: 'AI Assistant', icon: Bot },
  { href: '/spots', label: 'Spots', icon: MapPin },
  { href: '/catches', label: 'Catches', icon: Fish },
  { href: '/species', label: 'Species', icon: Fish },
  { href: '/conservation', label: 'Conservation', icon: ShieldCheck },
  { href: '/research', label: 'Research', icon: Beaker },
  { href: '/community', label: 'Community', icon: Users },
  { href: '/forum', label: 'Forum', icon: MessageSquare },
  { href: '/charters', label: 'Charters', icon: Anchor },
  { href: '/shop', label: 'Shop', icon: ShoppingBag },
  { href: '/advertise', label: 'Advertise', icon: BadgeCheck },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0f1a]/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-white font-bold text-sm">
            <Anchor className="w-4 h-4 text-teal-400" />
            <span>UAE Anglers Hub</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {label}
              </Link>
            ))}
          </div>

          {/* CTA + avatar */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/log-catch"
              className="flex items-center gap-1 bg-teal-500 hover:bg-teal-400 text-white text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Log Catch
            </Link>
            <Link
              href="/login"
              className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold"
            >
              JW
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden text-gray-300 hover:text-white p-1"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-[#0a0f1a] border-t border-white/10 px-4 py-3 space-y-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              {Icon && <Icon className="w-4 h-4" />}
              {label}
            </Link>
          ))}
          <Link
            href="/log-catch"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-teal-500 text-white font-semibold"
          >
            <Plus className="w-4 h-4" />
            Log Catch
          </Link>
        </div>
      )}
    </nav>
  );
}
