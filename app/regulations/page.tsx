import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, ChevronRight, AlertTriangle } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import RegulationsClient, { type Regulation } from './RegulationsClient';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'UAE Fishing Regulations & Seasonal Bans — MOCCAE | UAE Anglers Hub',
  description:
    'Complete guide to UAE fishing regulations including MOCCAE seasonal bans, minimum size limits, protected species, gear restrictions, and licensing requirements. Updated from official MOCCAE ministerial decisions.',
};

async function getRegulations(): Promise<Regulation[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('fishing_regulations')
      .select('*')
      .eq('is_active', true)
      .order('regulation_type', { ascending: true })
      .order('title', { ascending: true });

    if (error) throw error;
    return (data ?? []) as Regulation[];
  } catch {
    return [];
  }
}

export default async function RegulationsPage() {
  const regulations = await getRegulations();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section
        className="relative pt-28 pb-14 px-4"
        style={{
          background:
            'radial-gradient(ellipse at top right, rgba(239,68,68,0.10) 0%, transparent 50%), #0a0f1a',
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-6">
            <Link href="/" className="hover:text-teal-400 transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-300">Regulations</span>
          </div>

          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-4 py-1.5 text-red-400 text-sm mb-6">
            <Shield className="w-4 h-4" />
            MOCCAE Official Regulations
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
            UAE Fishing
            <br />
            <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #ef4444, #f97316)' }}>
              Regulations & Bans
            </span>
          </h1>

          <p className="text-gray-400 text-lg max-w-2xl mb-6 leading-relaxed">
            Official fishing regulations from the UAE Ministry of Climate Change and Environment (MOCCAE).
            Seasonal bans, minimum size limits, protected species, and licensing requirements — all in one place.
          </p>

          {/* Disclaimer */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 max-w-2xl">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-200/80 text-xs leading-relaxed">
              This page is for informational purposes. Always verify current regulations directly with{' '}
              <a
                href="https://moccae.gov.ae"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-amber-100"
              >
                MOCCAE
              </a>{' '}
              before fishing. Regulations may change. Violations are subject to penalties under Federal Law No. 23 of 1999.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 pb-20 pt-10">
        {regulations.length === 0 ? (
          <div className="text-center py-20">
            <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Regulations database not yet populated.</p>
            <p className="text-gray-600 text-sm mt-2">Run the SQL migration in Supabase to seed the regulations.</p>
          </div>
        ) : (
          <RegulationsClient regulations={regulations} />
        )}

        {/* Footer links */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <h3 className="text-white font-semibold mb-4">Useful Links</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {[
              { label: 'MOCCAE Official Website', href: 'https://moccae.gov.ae', external: true },
              { label: 'Fishing Licence Application', href: 'https://moccae.gov.ae/en/services/fishing-license.aspx', external: true },
              { label: 'Browse Species Guide', href: '/species', external: false },
              { label: 'Catch Reporting (Citizen Science)', href: '/research', external: false },
            ].map(({ label, href, external }) => (
              external ? (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-teal-500/30 text-gray-400 hover:text-white transition-all"
                >
                  <ChevronRight className="w-4 h-4 text-teal-400" />
                  {label}
                </a>
              ) : (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-teal-500/30 text-gray-400 hover:text-white transition-all"
                >
                  <ChevronRight className="w-4 h-4 text-teal-400" />
                  {label}
                </Link>
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
