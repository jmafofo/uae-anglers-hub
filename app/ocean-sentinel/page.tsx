'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Fish, WifiOff, Database, Link as LinkIcon, ChevronRight, Smartphone, Star, X, Bell } from 'lucide-react';
import { fishSpecies } from '@/lib/species';

// ── Realistic phone screen mockups ───────────────────────────────────────────

function PhoneHomeScreen() {
  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#0a1628', fontFamily: 'system-ui, sans-serif' }}>
      {/* Status bar */}
      <div className="flex justify-between items-center px-3 pt-2 pb-1">
        <span style={{ color: '#8ab4d4', fontSize: 7 }}>9:41</span>
        <div className="flex gap-1 items-center">
          <div style={{ width: 8, height: 5, border: '1px solid #8ab4d4', borderRadius: 1.5, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 1, left: 1, right: 1, bottom: 1, background: '#00d4aa', borderRadius: 1 }} />
          </div>
        </div>
      </div>
      {/* Header */}
      <div className="px-3 pt-1 pb-2" style={{ borderBottom: '1px solid #142954' }}>
        <div style={{ color: '#e8f4fd', fontWeight: 800, fontSize: 11 }}>Ocean Sentinel</div>
        <div style={{ color: '#8ab4d4', fontSize: 7, marginTop: 1 }}>UAE Fish Identification</div>
      </div>
      {/* Quick action */}
      <div className="px-3 pt-2">
        <div className="rounded-lg flex items-center justify-center gap-1.5" style={{ background: '#00d4aa', padding: '6px 0', marginBottom: 8 }}>
          <span style={{ fontSize: 10 }}>📷</span>
          <span style={{ color: '#0a1628', fontWeight: 700, fontSize: 8 }}>Scan Fish</span>
        </div>
        <div style={{ color: '#8ab4d4', fontSize: 7, marginBottom: 6, fontWeight: 600 }}>RECENT IDENTIFICATIONS</div>
        {[
          { name: 'Sobaity Seabream', conf: 85, time: '2h ago', color: '#00d4aa' },
          { name: 'Yellowfin Tuna', conf: 91, time: '1d ago', color: '#00d4aa' },
          { name: 'Unidentified ❓', conf: 32, time: '2d ago', color: '#ffb74d' },
        ].map((item) => (
          <div key={item.name} className="flex items-center justify-between rounded-lg mb-1.5" style={{ background: '#0f2044', padding: '5px 7px' }}>
            <div>
              <div style={{ color: '#e8f4fd', fontSize: 7.5, fontWeight: 600 }}>{item.name}</div>
              <div style={{ color: '#8ab4d4', fontSize: 6.5 }}>{item.time}</div>
            </div>
            <div style={{ color: item.color, fontSize: 7.5, fontWeight: 700 }}>{item.conf}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhoneCameraScreen() {
  return (
    <div className="w-full h-full flex flex-col relative" style={{ background: '#000' }}>
      {/* Top bar */}
      <div className="flex justify-between items-center px-3 py-2" style={{ background: 'rgba(0,0,0,0.6)' }}>
        <span style={{ fontSize: 9 }}>⚡</span>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 8 }}>Fish Scanner</span>
        <span style={{ fontSize: 9 }}>🔄</span>
      </div>
      {/* Viewfinder area */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {/* Simulated water/scene */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, #0d3a4a 0%, #051a25 100%)' }} />
        {/* Corner brackets */}
        <div className="relative" style={{ width: 70, height: 70, zIndex: 2 }}>
          {[
            { top: 0, left: 0, borderTop: '2px solid #00d4aa', borderLeft: '2px solid #00d4aa', borderRadius: '2px 0 0 0' },
            { top: 0, right: 0, borderTop: '2px solid #00d4aa', borderRight: '2px solid #00d4aa', borderRadius: '0 2px 0 0' },
            { bottom: 0, left: 0, borderBottom: '2px solid #00d4aa', borderLeft: '2px solid #00d4aa', borderRadius: '0 0 0 2px' },
            { bottom: 0, right: 0, borderBottom: '2px solid #00d4aa', borderRight: '2px solid #00d4aa', borderRadius: '0 0 2px 0' },
          ].map((style, i) => (
            <div key={i} style={{ position: 'absolute', width: 14, height: 14, ...style }} />
          ))}
          {/* Fish silhouette */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span style={{ fontSize: 22, opacity: 0.7 }}>🐟</span>
          </div>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 6.5, marginTop: 6, zIndex: 2 }}>Centre the fish in the frame</div>
        {/* GPS badge */}
        <div className="flex items-center gap-1 rounded-full px-2 py-0.5 mt-2" style={{ background: 'rgba(0,212,170,0.2)', border: '1px solid #00d4aa', zIndex: 2 }}>
          <span style={{ fontSize: 6 }}>📍</span>
          <span style={{ color: '#00d4aa', fontSize: 6, fontWeight: 700 }}>GPS</span>
        </div>
      </div>
      {/* Bottom controls */}
      <div className="flex items-center justify-around px-4 py-3" style={{ background: 'rgba(0,0,0,0.6)' }}>
        <span style={{ fontSize: 12 }}>🖼</span>
        <div className="rounded-full flex items-center justify-center" style={{ width: 28, height: 28, border: '3px solid #fff' }}>
          <div className="rounded-full" style={{ width: 20, height: 20, background: '#fff' }} />
        </div>
        <div style={{ width: 24 }} />
      </div>
    </div>
  );
}

function PhoneResultScreen() {
  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#0a1628' }}>
      <div className="px-3 pt-3 pb-2 flex items-center gap-2" style={{ borderBottom: '1px solid #142954' }}>
        <span style={{ fontSize: 10 }}>←</span>
        <span style={{ color: '#e8f4fd', fontWeight: 700, fontSize: 9 }}>Identification Result</span>
      </div>
      {/* Fish image placeholder */}
      <div className="mx-3 mt-2 rounded-xl flex items-center justify-center" style={{ background: '#0f2044', height: 44, border: '1px solid #142954' }}>
        <span style={{ fontSize: 26 }}>🐟</span>
      </div>
      {/* Top result */}
      <div className="mx-3 mt-2 rounded-xl p-2" style={{ background: '#0f2044', border: '1px solid #142954' }}>
        <div className="flex justify-between items-start mb-1">
          <div>
            <div style={{ color: '#e8f4fd', fontWeight: 800, fontSize: 9 }}>Sobaity Seabream</div>
            <div style={{ color: '#8ab4d4', fontSize: 7, fontStyle: 'italic' }}>Sparidentex hasta</div>
          </div>
          <div style={{ background: 'rgba(0,212,170,0.15)', border: '1px solid #00d4aa', borderRadius: 6, padding: '2px 5px' }}>
            <span style={{ color: '#00d4aa', fontWeight: 700, fontSize: 8 }}>85%</span>
          </div>
        </div>
        {/* Confidence bar */}
        <div className="rounded-full overflow-hidden" style={{ height: 4, background: '#142954' }}>
          <div className="h-full rounded-full" style={{ width: '85%', background: '#00d4aa' }} />
        </div>
        <div style={{ color: '#8ab4d4', fontSize: 6, marginTop: 3 }}>🐟 Pointed snout · yellow fin tips · Persian Gulf</div>
      </div>
      {/* Alternatives */}
      <div className="px-3 mt-2">
        <div style={{ color: '#8ab4d4', fontSize: 6.5, fontWeight: 600, marginBottom: 4 }}>ALTERNATIVES</div>
        {[{ name: 'Emperor Bream', pct: 52 }, { name: 'Silver Grunt', pct: 31 }].map((a) => (
          <div key={a.name} className="flex items-center justify-between rounded-lg mb-1" style={{ background: '#0f2044', padding: '4px 7px' }}>
            <span style={{ color: '#c5dff0', fontSize: 7 }}>{a.name}</span>
            <span style={{ color: '#8ab4d4', fontSize: 7 }}>{a.pct}%</span>
          </div>
        ))}
      </div>
      {/* Save button */}
      <div className="mx-3 mt-auto mb-2 rounded-xl flex items-center justify-center gap-1" style={{ background: '#00d4aa', padding: '7px 0' }}>
        <span style={{ fontSize: 8 }}>✓</span>
        <span style={{ color: '#0a1628', fontWeight: 700, fontSize: 8 }}>Save to Diary</span>
      </div>
    </div>
  );
}

function PhoneDetailScreen() {
  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#0a1628' }}>
      <div className="px-3 pt-3 pb-2 flex items-center gap-2" style={{ borderBottom: '1px solid #142954' }}>
        <span style={{ fontSize: 10 }}>←</span>
        <span style={{ color: '#e8f4fd', fontWeight: 700, fontSize: 9 }}>Species Detail</span>
      </div>
      <div className="px-3 pt-2">
        <div style={{ color: '#e8f4fd', fontWeight: 800, fontSize: 11 }}>Sobaity Seabream</div>
        <div style={{ color: '#8ab4d4', fontSize: 7.5, fontStyle: 'italic', marginBottom: 6 }}>Sparidentex hasta</div>
        {/* Chips */}
        <div className="flex flex-wrap gap-1 mb-3">
          {[
            { label: 'Reef', color: '#00d4aa' },
            { label: 'Persian Gulf', color: '#4fc3f7' },
            { label: 'Edible', color: '#81c784' },
            { label: 'LC', color: '#aaa' },
          ].map((chip) => (
            <span key={chip.label} style={{ background: '#0f2044', color: chip.color, fontSize: 6.5, fontWeight: 600, borderRadius: 5, padding: '2px 6px', border: `1px solid ${chip.color}30` }}>
              {chip.label}
            </span>
          ))}
        </div>
        {/* Info rows */}
        {[
          { k: 'Max size', v: '75 cm' },
          { k: 'Max weight', v: '12 kg' },
          { k: 'Depth', v: '10–80 m' },
          { k: 'Diet', v: 'Crustaceans, fish' },
        ].map(({ k, v }) => (
          <div key={k} className="flex justify-between mb-1" style={{ borderBottom: '1px solid #0f2044', paddingBottom: 3 }}>
            <span style={{ color: '#8ab4d4', fontSize: 6.5 }}>{k}</span>
            <span style={{ color: '#e8f4fd', fontSize: 6.5, fontWeight: 600 }}>{v}</span>
          </div>
        ))}
        <div style={{ color: '#c5dff0', fontSize: 6.5, lineHeight: 1.5, marginTop: 5 }}>
          A prized sport fish of the Arabian Gulf, often found around rocky reefs and coral patches...
        </div>
      </div>
    </div>
  );
}

function PhoneCatchesScreen() {
  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#0a1628' }}>
      <div className="px-3 pt-3 pb-2" style={{ borderBottom: '1px solid #142954' }}>
        <div style={{ color: '#e8f4fd', fontWeight: 800, fontSize: 11 }}>My Catches</div>
        <div style={{ color: '#8ab4d4', fontSize: 7 }}>3 recorded this week</div>
      </div>
      <div className="px-3 pt-2 flex-1">
        {[
          { name: 'Sobaity Seabream', sci: 'Sparidentex hasta', time: 'Today, 09:14', loc: 'Dubai Marina', conf: 85 },
          { name: 'Yellowfin Tuna', sci: 'Thunnus albacares', time: 'Yesterday', loc: 'Fujairah offshore', conf: 91 },
          { name: 'Unidentified', sci: 'unnamed_0007', time: '2 days ago', loc: 'Abu Dhabi', conf: 32 },
        ].map((c, i) => (
          <div key={i} className="rounded-xl mb-2 p-2" style={{ background: '#0f2044', border: '1px solid #142954' }}>
            <div className="flex justify-between items-start">
              <div>
                <div style={{ color: '#e8f4fd', fontSize: 8, fontWeight: 700 }}>{c.name}</div>
                <div style={{ color: '#8ab4d4', fontSize: 6, fontStyle: 'italic' }}>{c.sci}</div>
              </div>
              <div style={{ color: c.conf > 60 ? '#00d4aa' : '#ffb74d', fontSize: 7.5, fontWeight: 700 }}>{c.conf}%</div>
            </div>
            <div className="flex gap-2 mt-1">
              <span style={{ color: '#4a7fa8', fontSize: 6 }}>🕐 {c.time}</span>
              <span style={{ color: '#4a7fa8', fontSize: 6 }}>📍 {c.loc}</span>
            </div>
          </div>
        ))}
      </div>
      {/* Tab bar */}
      <div className="flex justify-around items-center py-2" style={{ borderTop: '1px solid #142954' }}>
        {['🏠', '📷', '🗺️', '📋'].map((icon, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <span style={{ fontSize: 10, opacity: i === 3 ? 1 : 0.4 }}>{icon}</span>
            <div style={{ width: 3, height: 3, borderRadius: '50%', background: i === 3 ? '#00d4aa' : 'transparent' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

const APP_SCREENS = [
  { label: 'Home Screen',    desc: 'Quick access to camera and recent IDs', Screen: PhoneHomeScreen },
  { label: 'Camera Capture', desc: 'Point & shoot with GPS lock',            Screen: PhoneCameraScreen },
  { label: 'Species Result', desc: 'Top-3 candidates with visual evidence',  Screen: PhoneResultScreen },
  { label: 'Species Detail', desc: 'Full info: diet, habitat, conservation', Screen: PhoneDetailScreen },
  { label: 'My Catches',     desc: 'Personal catch history & cloud sync',    Screen: PhoneCatchesScreen },
];

export default function OceanSentinelPage() {
  const speciesCount = fishSpecies.length;
  const [showNotify, setShowNotify] = useState(false);
  const [notified, setNotified] = useState(false);
  const [email, setEmail] = useState('');

  function handleDownloadClick() {
    setShowNotify(true);
  }

  function handleNotifySubmit(e: React.FormEvent) {
    e.preventDefault();
    setNotified(true);
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section
        className="relative pt-28 pb-20 px-4 overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse at center top, rgba(0,180,150,0.18) 0%, transparent 65%), #0a0f1a',
        }}
      >
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '35px 35px',
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 rounded-full px-4 py-1.5 text-teal-400 text-sm mb-6">
            <Smartphone className="w-4 h-4" />
            Mobile App — Coming Soon
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-4">
            Ocean Sentinel
          </h1>
          <p className="text-2xl font-semibold text-teal-400 mb-5">AI Fish Identification App</p>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            Photograph a fish, get the species name in seconds — with GPS-matched results filtered
            to your exact UAE coast. Powered by Claude Vision AI, built for the angling community.
          </p>

          {/* Download buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <button
              onClick={handleDownloadClick}
              className="flex items-center gap-3 bg-white/10 border border-white/20 hover:border-teal-500/50 hover:bg-white/15 rounded-xl px-5 py-3 transition-all group"
            >
              <div className="text-2xl">🍎</div>
              <div className="text-left">
                <p className="text-xs text-gray-400">Download on the</p>
                <p className="text-white font-bold text-sm">App Store</p>
              </div>
              <span className="ml-auto text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full">Soon</span>
            </button>
            <button
              onClick={handleDownloadClick}
              className="flex items-center gap-3 bg-white/10 border border-white/20 hover:border-teal-500/50 hover:bg-white/15 rounded-xl px-5 py-3 transition-all group"
            >
              <div className="text-2xl">🤖</div>
              <div className="text-left">
                <p className="text-xs text-gray-400">Get it on</p>
                <p className="text-white font-bold text-sm">Google Play</p>
              </div>
              <span className="ml-auto text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full">Soon</span>
            </button>
          </div>

          <p className="text-gray-600 text-sm">
            Notify me when it launches →{' '}
            <button onClick={handleDownloadClick} className="text-teal-400 hover:text-teal-300 transition-colors underline underline-offset-2">
              Get early access
            </button>
          </p>

          {/* Coming Soon Modal */}
          {showNotify && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
              onClick={(e) => { if (e.target === e.currentTarget) setShowNotify(false); }}
            >
              <div className="relative bg-[#0d1525] border border-white/15 rounded-2xl p-8 max-w-md w-full shadow-2xl">
                <button
                  onClick={() => setShowNotify(false)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center mb-5">
                    <Smartphone className="w-7 h-7 text-teal-400" />
                  </div>

                  {notified ? (
                    <>
                      <h2 className="text-white text-xl font-bold mb-2">You&apos;re on the list!</h2>
                      <p className="text-gray-400 text-sm leading-relaxed mb-6">
                        We&apos;ll notify you at <span className="text-teal-400">{email}</span> the moment Ocean Sentinel is available to download.
                      </p>
                      <button
                        onClick={() => { setShowNotify(false); setNotified(false); setEmail(''); }}
                        className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        Close
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/25 rounded-full px-3 py-1 text-yellow-400 text-xs mb-4">
                        <Bell className="w-3.5 h-3.5" />
                        Coming Soon
                      </div>
                      <h2 className="text-white text-xl font-bold mb-2">Ocean Sentinel is in development</h2>
                      <p className="text-gray-400 text-sm leading-relaxed mb-6">
                        The app is not yet available in the App Store or Google Play. Enter your email to be first in line when we launch.
                      </p>
                      <form onSubmit={handleNotifySubmit} className="w-full flex flex-col gap-3">
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-teal-500/50"
                        />
                        <button
                          type="submit"
                          className="w-full bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
                        >
                          Notify Me at Launch
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 pb-16 space-y-20">
        {/* Feature Highlights */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Why Ocean Sentinel?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                icon: Star,
                title: 'Claude Vision AI',
                desc: `Anthropic Claude Vision identifies ${speciesCount}+ UAE species from a single photo. Returns top-3 candidates with confidence scores and the visual features that led to each ID.`,
                color: 'text-teal-400 bg-teal-500/10',
                badge: null,
              },
              {
                icon: WifiOff,
                title: 'GPS-Filtered Results',
                desc: 'Your GPS position determines which coast you\'re fishing — Persian Gulf or Gulf of Oman. The AI only considers species native to that zone, cutting false matches dramatically.',
                color: 'text-blue-400 bg-blue-500/10',
                badge: 'Key Feature',
              },
              {
                icon: Database,
                title: 'Full Species Database',
                desc: `Scientific names, habitat, diet, depth range, conservation status, and fun facts for every species. ${speciesCount} species and growing.`,
                color: 'text-indigo-400 bg-indigo-500/10',
                badge: null,
              },
              {
                icon: LinkIcon,
                title: 'Sync to uaeangler.com',
                desc: 'Log catches directly from your identification results. Your Ocean Sentinel history syncs seamlessly with your UAE Anglers Hub profile.',
                color: 'text-green-400 bg-green-500/10',
                badge: 'Coming Soon',
              },
            ].map(({ icon: Icon, title, desc, color, badge }) => (
              <div key={title} className="p-6 rounded-2xl bg-white/5 border border-white/10 relative">
                {badge && (
                  <span className={`absolute top-4 right-4 text-xs px-2 py-0.5 rounded-full ${
                    badge === 'Coming Soon' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                  }`}>
                    {badge}
                  </span>
                )}
                <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center mb-4`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* App Screenshots */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-3 text-center">App Preview</h2>
          <p className="text-gray-400 text-center mb-10 text-sm">5 screens designed for use in bright sunlight, one-handed, on a moving boat.</p>
          <div className="flex flex-wrap justify-center gap-5">
            {APP_SCREENS.map(({ label, desc, Screen }) => (
              <div key={label} className="flex flex-col items-center gap-3">
                {/* Phone frame */}
                <div
                  className="relative overflow-hidden shadow-2xl"
                  style={{
                    width: 144,
                    aspectRatio: '9/19',
                    borderRadius: 24,
                    border: '2px solid rgba(255,255,255,0.12)',
                    boxShadow: '0 0 0 1px rgba(0,212,170,0.15), 0 25px 50px rgba(0,0,0,0.6)',
                  }}
                >
                  {/* Notch */}
                  <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 10, width: 32, height: 6, background: 'rgba(0,0,0,0.8)', borderRadius: '0 0 8px 8px' }} />
                  <Screen />
                </div>
                <p className="text-white text-xs font-semibold">{label}</p>
                <p className="text-gray-500 text-xs text-center" style={{ maxWidth: 144 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tech specs */}
        <section className="p-8 rounded-2xl bg-gradient-to-br from-teal-900/20 to-blue-900/20 border border-teal-500/20">
          <h2 className="text-2xl font-bold text-white mb-6">Technical Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
            {[
              { label: 'AI Model',          value: 'Claude Vision (Sonnet)' },
              { label: 'Location Aware',    value: 'GPS coast filtering' },
              { label: 'Species Coverage',  value: `${speciesCount}+ UAE species` },
              { label: 'ID Candidates',     value: 'Top 3 with evidence' },
              { label: 'Platforms',         value: 'iOS 15+ / Android 10+' },
              { label: 'Data Sync',         value: 'uaeangler.com cloud' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-gray-500 text-xs mb-1">{label}</p>
                <p className="text-white font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Links to related pages */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Explore More</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/species"
              className="group flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-teal-500/40 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center">
                  <Fish className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">Species Guide</p>
                  <p className="text-gray-400 text-sm">Browse all {speciesCount} species with full details</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-teal-400 transition-colors" />
            </Link>
            <Link
              href="/research"
              className="group flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-teal-500/40 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Database className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">Research Program</p>
                  <p className="text-gray-400 text-sm">How your data supports UAE marine science</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-teal-400 transition-colors" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
