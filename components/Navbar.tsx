'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapPin,
  Fish,
  Users,
  Menu,
  X,
  Plus,
  ShieldCheck,
  Beaker,
  BadgeCheck,
  Scale,
  Smartphone,
  Newspaper,
  Anchor,
  Info,
} from 'lucide-react';
import LocaleSwitcher from './LocaleSwitcher';
import NotificationsDropdown from './NotificationsDropdown';
import { getSupabase } from '@/lib/supabase';

const navLinks = [
  { href: '/', label: 'Home', icon: null },
  { href: '/about', label: 'About', icon: Info },
  { href: '/feed', label: 'Feed', icon: Newspaper },
  { href: '/spots', label: 'Spots', icon: MapPin },
  { href: '/charters', label: 'Charters', icon: Anchor },
  { href: '/species', label: 'Species', icon: Fish },
  { href: '/clubs', label: 'Clubs', icon: Users },
  { href: '/conservation', label: 'Conservation', icon: ShieldCheck },
  { href: '/research', label: 'Research', icon: Beaker },
  { href: '/regulations', label: 'Regulations', icon: Scale },
  { href: '/community', label: 'Community', icon: Users },
  { href: '/shop', label: 'Shop', icon: null },
  { href: '/advertise', label: 'Advertise', icon: BadgeCheck },
  { href: '/ocean-sentinel', label: 'App', icon: Smartphone },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<{ display_name?: string; username?: string } | null>(null);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  const loadUser = useCallback(async () => {
    const sb = getSupabase();
    const { data: { user: u } } = await sb.auth.getUser();
    if (u) {
      setUser(u);
      const { data: prof } = await sb.from('profiles').select('display_name, username').eq('id', u.id).single();
      setProfile(prof);
    }
  }, []);

  useEffect(() => {
    loadUser();
    const sb = getSupabase();
    const { data: listener } = sb.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        sb.from('profiles').select('display_name, username').eq('id', session.user.id).single().then(({ data }) => setProfile(data));
      } else {
        setUser(null);
        setProfile(null);
      }
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, [loadUser]);

  async function handleSignOut() {
    await getSupabase().auth.signOut();
    setUser(null);
    setProfile(null);
    setAvatarOpen(false);
    window.location.href = '/';
  }

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (menuOpen) { setMenuOpen(false); toggleRef.current?.focus(); }
        if (avatarOpen) setAvatarOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen, avatarOpen]);

  // Focus trap inside mobile menu
  useEffect(() => {
    if (!menuOpen || !menuRef.current) return;
    const menu = menuRef.current;
    const focusable = menu.querySelectorAll<HTMLElement>(
      'a[href], button, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    function trap(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
    menu.addEventListener('keydown', trap);
    return () => menu.removeEventListener('keydown', trap);
  }, [menuOpen]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0f1a]/95 md:bg-[#0a0f1a]/90 md:backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo + wordmark */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/logo-icon.png"
              alt="UAE Anglers Hub"
              width={36}
              height={36}
              priority
              className="rounded"
            />
            <span className="text-white font-bold text-sm tracking-tight hidden sm:inline">
              UAE Anglers Hub
            </span>
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

          {/* CTA + avatar + locale + notifications */}
          <div className="hidden lg:flex items-center gap-3">
            {user && <NotificationsDropdown />}
            <LocaleSwitcher />
            <Link
              href="/log-catch"
              className="flex items-center gap-1 bg-teal-500 hover:bg-teal-400 text-white text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Log Catch
            </Link>
            {user ? (
              <div className="relative" ref={avatarRef}>
                <button
                  onClick={() => setAvatarOpen(!avatarOpen)}
                  className="w-8 h-8 rounded-full bg-teal-600 hover:bg-teal-500 flex items-center justify-center text-white text-xs font-bold transition-colors"
                >
                  {profile?.display_name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?'}
                </button>
                {avatarOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#0f1724] border border-white/10 rounded-xl shadow-2xl z-50 py-1">
                    <p className="px-3 py-2 text-xs text-gray-400 border-b border-white/10 truncate">
                      @{profile?.username ?? 'user'}
                    </p>
                    <Link
                      href="/dashboard"
                      onClick={() => setAvatarOpen(false)}
                      className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href={`/profile/${profile?.username ?? ''}`}
                      onClick={() => setAvatarOpen(false)}
                      className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="text-xs text-teal-400 hover:text-teal-300 font-semibold transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            ref={toggleRef}
            className="lg:hidden text-gray-300 hover:text-white p-1"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          ref={menuRef}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className="lg:hidden bg-[#0a0f1a] border-t border-white/10 px-4 py-3 space-y-1"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setMenuOpen(false);
          }}
        >
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
