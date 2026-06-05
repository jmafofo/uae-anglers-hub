import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import {
  Anchor, MapPin, Clock, Users, Fish, Star,
  Phone, ArrowLeft, Mail, Globe,
} from 'lucide-react';

const COAST_COLOUR: Record<string, string> = {
  'Persian Gulf': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Gulf of Oman': 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  Both: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await supabase.from('charters').select('name, location').eq('slug', slug).maybeSingle();
  return {
    title: data ? `${data.name} — UAE Fishing Charter` : 'Charter Not Found',
    description: data
      ? `Book ${data.name} in ${data.location}. Deep-sea and offshore fishing charters in the UAE.`
      : 'Charter not found.',
  };
}

export const revalidate = 300;

export default async function CharterDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: c } = await supabase
    .from('charters')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (!c) notFound();

  return (
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="max-w-3xl mx-auto">
        <Link href="/charters" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Charters
        </Link>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${COAST_COLOUR[c.coast] || COAST_COLOUR['Both']}`}>
                  {c.coast}
                </span>
                {c.is_verified && (
                  <span className="text-xs text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full">
                    ✓ Verified
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-extrabold text-white">{c.name}</h1>
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5" />
                {c.location}
                {c.emirate && `, ${c.emirate}`}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-gray-500 mb-0.5">From</p>
              <p className="text-2xl font-extrabold text-teal-400">AED {c.price_aed?.toLocaleString()}</p>
              <p className="text-xs text-gray-600">per trip</p>
              <div className="flex items-center gap-1 justify-end mt-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="text-sm text-gray-400">{c.rating}</span>
              </div>
            </div>
          </div>

          {/* Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { icon: Clock, label: 'Duration', value: c.duration },
              { icon: Users, label: 'Capacity', value: c.capacity ? `Up to ${c.capacity}` : null },
              { icon: MapPin, label: 'Country', value: c.country },
              { icon: Fish, label: 'Type', value: (c.charter_type || []).join(', ') },
            ].map(({ icon: Icon, label, value }) =>
              value ? (
                <div key={label} className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <Icon className="w-4 h-4 text-teal-400 mb-1.5" />
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-sm text-white font-medium">{value}</p>
                </div>
              ) : null
            )}
          </div>

          {/* Target Species */}
          <div className="mb-5">
            <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Target Species</p>
            <div className="flex flex-wrap gap-1.5">
              {(c.target_species || []).map((s: string) => (
                <span key={s} className="text-xs text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Fish className="w-2.5 h-2.5" />
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Highlights */}
          <div className="mb-5">
            <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Highlights</p>
            <ul className="space-y-1.5">
              {(c.highlights || []).map((h: string) => (
                <li key={h} className="text-sm text-gray-400 flex items-start gap-2">
                  <span className="text-teal-500 mt-0.5 shrink-0">✓</span>
                  {h}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="flex flex-wrap gap-2">
            {c.contact_email && (
              <a
                href={`mailto:${c.contact_email}?subject=Charter Enquiry — ${c.name}`}
                className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                <Mail className="w-4 h-4" />
                Email Enquiry
              </a>
            )}
            {c.phone && (
              <a
                href={`tel:${c.phone}`}
                className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                <Phone className="w-4 h-4" />
                {c.phone}
              </a>
            )}
            {c.website && (
              <a
                href={c.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                <Globe className="w-4 h-4" />
                Website
              </a>
            )}
            {!c.contact_email && !c.phone && (
              <a
                href={`mailto:info@uaeangler.com?subject=Charter Enquiry — ${c.name}`}
                className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                <Phone className="w-4 h-4" />
                Enquire via UAE Anglers Hub
              </a>
            )}
          </div>
        </div>

        {/* Related charters */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
          <h2 className="text-lg font-bold text-white mb-4">More Charters</h2>
          <Link
            href="/charters"
            className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 text-sm transition-colors"
          >
            <Anchor className="w-4 h-4" />
            Browse all charters
          </Link>
        </div>
      </div>
    </div>
  );
}
