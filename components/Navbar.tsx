'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Menu, X, Plus, ChevronDown, Compass, Fish, Users, CloudSun, Anchor, BookOpen, ShieldCheck, ShoppingBag, FlaskConical, Smartphone, Info, BadgeCheck, Newspaper } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import NotificationsDropdown from './NotificationsDropdown';
import LocaleSwitcher from './LocaleSwitcher';

const primaryLinks = [
  { href: '/spots', label: 'Fishing spots', icon: Compass },
  { href: '/species', label: 'Species guide', icon: Fish },
  { href: '/community', label: 'Community', icon: Users },
  { href: '/weather', label: 'Weather', icon: CloudSun },
];
const moreLinks = [
  { href: '/charters', label: 'Fishing charters', icon: Anchor },
  { href: '/clubs', label: 'Local clubs', icon: Users },
  { href: '/feed', label: 'Following feed', icon: Newspaper },
  { href: '/beginners-guide', label: 'Beginner’s guide', icon: BookOpen },
  { href: '/regulations', label: 'Fishing regulations', icon: ShieldCheck },
  { href: '/shop', label: 'Tackle shop', icon: ShoppingBag },
  { href: '/conservation', label: 'Conservation', icon: ShieldCheck },
  { href: '/research', label: 'Marine research', icon: FlaskConical },
  { href: '/ocean-sentinel', label: 'Ocean Sentinel app', icon: Smartphone },
  { href: '/about', label: 'About UAEAngler', icon: Info },
  { href: '/advertise', label: 'Advertise with us', icon: BadgeCheck },
];

type Member = { id: string; email?: string };
type Profile = { display_name?: string; username?: string };
export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState<'mobile' | 'more' | 'account' | null>(null);
  const [user, setUser] = useState<Member | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const mobileToggle = useRef<HTMLButtonElement>(null);
  const moreToggle = useRef<HTMLButtonElement>(null);
  const accountToggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const sb = getSupabase();
    let active = true;
    let version = 0;
    async function update(member: Member | null) {
      const current = ++version;
      if (!active) return;
      setUser(member);
      setProfile(null);
      if (member) {
        const { data } = await sb.from('profiles').select('display_name, username').eq('id', member.id).single();
        if (active && current === version) setProfile(data);
      }
    }
    const { data: listener } = sb.auth.onAuthStateChange((_event, session) => { void update(session?.user ?? null); });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent) { if (!navRef.current?.contains(event.target as Node)) setOpen(null); }
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(null);
        (open === 'mobile' ? mobileToggle : open === 'more' ? moreToggle : accountToggle).current?.focus();
      }
    }
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', escape); };
  }, [open]);

  useEffect(() => {
    if (open !== 'mobile') return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const menu = mobileRef.current;
    const focusable = menu?.querySelectorAll<HTMLElement>('a[href], button');
    focusable?.[0]?.focus();
    function trap(event: KeyboardEvent) {
      if (event.key !== 'Tab' || !focusable?.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    menu?.addEventListener('keydown', trap);
    return () => { document.body.style.overflow = previousOverflow; menu?.removeEventListener('keydown', trap); };
  }, [open]);

  function active(href: string) { return pathname === href || pathname.startsWith(`${href}/`); }
  function close() { setOpen(null); }
  async function signOut() {
    const { error } = await getSupabase().auth.signOut();
    if (!error) { setUser(null); setProfile(null); close(); window.location.href = '/'; }
  }
  return <nav ref={navRef} className="coastal-nav fixed inset-x-0 top-0 z-50" aria-label="Main navigation">
    <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      <Link href="/" onClick={close} className="flex shrink-0 items-center gap-2.5" aria-label="UAEAngler home"><Image src="/logo-icon.png" width={34} height={34} alt="" className="rounded-lg bg-[#173744] p-1" priority /><span className="text-lg font-semibold tracking-tight text-[#173744]">UAE<span className="font-normal">Angler</span><span className="ml-1 text-teal-700">.</span></span></Link>
      <div className="hidden items-center gap-1 xl:flex">{primaryLinks.map(link => <Link key={link.href} href={link.href} onClick={close} aria-current={active(link.href) ? 'page' : undefined} className="nav-link">{link.label}</Link>)}
        <div className="relative"><button ref={moreToggle} className="nav-link" onClick={() => setOpen(open === 'more' ? null : 'more')} aria-expanded={open === 'more'} aria-controls="more-navigation">Explore <ChevronDown size={14} /></button>{open === 'more' && <div id="more-navigation" className="absolute right-0 top-full mt-3 grid w-[480px] grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">{moreLinks.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={close} className="nav-link" aria-current={active(href) ? 'page' : undefined}><Icon size={16} />{label}</Link>)}</div>}</div>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/log-catch" onClick={close} className="hidden items-center gap-1.5 rounded-lg bg-[#23675e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#174e47] sm:flex"><Plus size={16} />Log a catch</Link>
        <div className="hidden items-center gap-3 xl:flex"><LocaleSwitcher />{user ? <><NotificationsDropdown /><div className="relative"><button ref={accountToggle} className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-sm font-semibold text-teal-900" aria-label="Account menu" aria-expanded={open === 'account'} aria-controls="account-menu" onClick={() => setOpen(open === 'account' ? null : 'account')}>{profile?.display_name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? 'A'}</button>{open === 'account' && <div id="account-menu" className="absolute right-0 mt-3 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"><Link href="/dashboard" onClick={close} className="nav-link">Dashboard</Link>{profile?.username && <Link href={`/profile/${profile.username}`} onClick={close} className="nav-link">My profile</Link>}<Link href="/community/messages" onClick={close} className="nav-link">Messages</Link><Link href="/settings" onClick={close} className="nav-link">Settings</Link><button onClick={signOut} className="nav-link w-full">Sign out</button></div>}</div></> : <Link href="/login" className="nav-link">Sign in</Link>}</div>
        <button ref={mobileToggle} className="flex h-10 w-10 items-center justify-center xl:hidden" aria-label="Open navigation" aria-expanded={open === 'mobile'} aria-controls="mobile-menu" onClick={() => setOpen(open === 'mobile' ? null : 'mobile')}><Menu size={22} /></button>
      </div>
    </div>
    {open === 'mobile' && <div ref={mobileRef} id="mobile-menu" role="dialog" aria-modal="true" aria-label="Navigation" className="fixed inset-0 overflow-y-auto bg-white px-5 pb-8 pt-4 xl:hidden"><div className="mb-5 flex items-center justify-between"><span className="text-lg font-semibold">Explore UAEAngler</span><button onClick={() => { close(); mobileToggle.current?.focus(); }} aria-label="Close navigation" className="p-3"><X size={22} /></button></div><div className="mb-6 flex flex-wrap gap-3 border-b border-slate-200 pb-6"><Link href="/log-catch" onClick={close} className="coastal-button">Log a catch</Link>{user ? <><Link href="/dashboard" onClick={close} className="coastal-button secondary">Dashboard</Link><Link href="/community/messages" onClick={close} className="coastal-button secondary">Messages</Link><Link href="/settings" onClick={close} className="coastal-button secondary">Settings</Link><button onClick={signOut} className="coastal-button secondary">Sign out</button></> : <><Link href="/login" onClick={close} className="coastal-button secondary">Sign in</Link><Link href="/signup" onClick={close} className="coastal-button secondary">Join the community</Link></>}</div><div className="mb-4"><LocaleSwitcher /></div><div className="grid gap-2 sm:grid-cols-2">{[...primaryLinks, ...moreLinks].map(({ href, label, icon: Icon }) => <Link href={href} key={href} onClick={close} aria-current={active(href) ? 'page' : undefined} className="nav-link min-h-11"><Icon size={18} />{label}</Link>)}</div></div>}
  </nav>;
}
