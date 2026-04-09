'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Fish, WifiOff, Database, Link as LinkIcon, ChevronRight, Smartphone, Star, X, Bell } from 'lucide-react';
import { fishSpecies } from '@/lib/species';

const APP_SCREENS = [
  {
    label: 'Home Screen',
    gradient: 'from-teal-900/80 to-[#0a0f1a]',
    icon: '🏠',
    desc: 'Quick access to camera and recent IDs',
  },
  {
    label: 'Camera Capture',
    gradient: 'from-blue-900/80 to-teal-900/80',
    icon: '📷',
    desc: 'Point & shoot — works in any light',
  },
  {
    label: 'Species Result',
    gradient: 'from-cyan-900/80 to-blue-900/80',
    icon: '🐟',
    desc: 'Instant ID with confidence score',
  },
  {
    label: 'Species Detail',
    gradient: 'from-indigo-900/80 to-cyan-900/80',
    icon: '📖',
    desc: 'Full info: diet, habitat, conservation',
  },
  {
    label: 'My Catches',
    gradient: 'from-teal-900/80 to-indigo-900/80',
    icon: '📊',
    desc: 'Personal catch history & sync',
  },
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
            Identify any fish species instantly — works fully offline, perfect for boat trips.
            Powered by TensorFlow AI, trained on UAE waters.
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
                title: 'AI-Powered ID',
                desc: `TensorFlow AI identifies ${speciesCount}+ UAE species from a photo. Top-3 predictions with confidence scores so you always have context.`,
                color: 'text-teal-400 bg-teal-500/10',
                badge: null,
              },
              {
                icon: WifiOff,
                title: 'Works Offline',
                desc: 'Download once, identify anywhere — no signal needed at sea. The full AI model and species database runs entirely on your device.',
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
            {APP_SCREENS.map((screen) => (
              <div key={screen.label} className="flex flex-col items-center gap-3">
                {/* Phone frame */}
                <div
                  className={`w-36 aspect-[9/19] rounded-3xl bg-gradient-to-b ${screen.gradient} border border-white/10 flex flex-col items-center justify-center gap-2 p-3 shadow-2xl`}
                >
                  <div className="w-8 h-1.5 rounded-full bg-white/20 mb-1" /> {/* notch */}
                  <div className="text-3xl">{screen.icon}</div>
                  <div className="w-full space-y-1.5 mt-2">
                    <div className="h-2 bg-white/10 rounded-full" />
                    <div className="h-1.5 bg-white/5 rounded-full w-4/5" />
                    <div className="h-1.5 bg-white/5 rounded-full w-2/3" />
                  </div>
                  <div className="w-full h-6 rounded-lg bg-teal-500/30 mt-auto flex items-center justify-center">
                    <div className="h-1.5 w-16 bg-teal-400/40 rounded-full" />
                  </div>
                </div>
                <p className="text-white text-xs font-medium">{screen.label}</p>
                <p className="text-gray-500 text-xs text-center max-w-[144px]">{screen.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tech specs */}
        <section className="p-8 rounded-2xl bg-gradient-to-br from-teal-900/20 to-blue-900/20 border border-teal-500/20">
          <h2 className="text-2xl font-bold text-white mb-6">Technical Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
            {[
              { label: 'AI Framework', value: 'TensorFlow Lite' },
              { label: 'Model Size', value: '~8 MB on device' },
              { label: 'Species Coverage', value: `${speciesCount}+ UAE species` },
              { label: 'Accuracy', value: '91%+ top-1 accuracy' },
              { label: 'Platforms', value: 'iOS 15+ / Android 10+' },
              { label: 'Connectivity', value: 'Full offline support' },
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
