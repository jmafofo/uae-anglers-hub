'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, Ban, Ruler, ShieldAlert, AlertTriangle,
  ExternalLink, Fish, Scale, Key, MapPinOff, Building2,
} from 'lucide-react';

export interface Regulation {
  id: string;
  species_slugs: string[];
  species_names: string[];
  title: string;
  regulation_type: string;
  description: string | null;
  ban_start_month: number | null;
  ban_start_day: number | null;
  ban_end_month: number | null;
  ban_end_day: number | null;
  ban_scope: string | null;
  min_size_cm: number | null;
  min_weight_kg: number | null;
  authority: string | null;
  authority_type?: 'federal' | 'emirate';
  emirate?: string | null;
  legal_ref: string | null;
  source_url: string | null;
  applies_to_coast: string | null;
  applies_to_all_species: boolean;
  notes?: string | null;
}

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatBanPeriod(reg: Regulation): string | null {
  if (!reg.ban_start_month || !reg.ban_end_month) return null;
  return `${MONTH_NAMES[reg.ban_start_month]} ${reg.ban_start_day ?? 1} – ${MONTH_NAMES[reg.ban_end_month]} ${reg.ban_end_day ?? 28}`;
}

function isBanActive(reg: Regulation): boolean {
  if (!reg.ban_start_month || !reg.ban_end_month) return false;
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const startM = reg.ban_start_month, startD = reg.ban_start_day ?? 1;
  const endM = reg.ban_end_month, endD = reg.ban_end_day ?? 28;
  if (startM === endM) return month === startM && day >= startD && day <= endD;
  if (month === startM) return day >= startD;
  if (month === endM) return day <= endD;
  return month > startM && month < endM;
}

const TYPE_CONFIG = {
  seasonal_ban:          { label: 'Seasonal Ban',          icon: Ban,          color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30' },
  size_limit:            { label: 'Size Limit',             icon: Ruler,        color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/30' },
  protected_species:     { label: 'Protected Species',      icon: ShieldAlert,  color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
  gear_restriction:      { label: 'Gear Restriction',       icon: AlertTriangle,color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  licensing:             { label: 'Licensing',              icon: Key,          color: 'text-sky-400',    bg: 'bg-sky-500/10 border-sky-500/30' },
  marine_protected_area: { label: 'Marine Protected Area',  icon: MapPinOff,    color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
  general:               { label: 'General Rule',           icon: Scale,        color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/30' },
};

const REG_TYPES = Object.keys(TYPE_CONFIG) as (keyof typeof TYPE_CONFIG)[];

export default function RegulationsClient({ regulations }: { regulations: Regulation[] }) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [authorityFilter, setAuthorityFilter] = useState<'all' | 'federal' | 'emirate'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return regulations.filter((r) => {
      const matchQ = !q ||
        r.title.toLowerCase().includes(q) ||
        r.species_names.some((n) => n.toLowerCase().includes(q)) ||
        (r.description ?? '').toLowerCase().includes(q) ||
        (r.legal_ref ?? '').toLowerCase().includes(q) ||
        (r.authority ?? '').toLowerCase().includes(q) ||
        (r.emirate ?? '').toLowerCase().includes(q);
      const matchType = !typeFilter || r.regulation_type === typeFilter;
      const matchAuth =
        authorityFilter === 'all' ||
        (authorityFilter === 'federal' && (r.authority_type === 'federal' || !r.authority_type)) ||
        (authorityFilter === 'emirate' && r.authority_type === 'emirate');
      return matchQ && matchType && matchAuth;
    });
  }, [regulations, query, typeFilter, authorityFilter]);

  const activeNow = regulations.filter(isBanActive);

  // Count by type for badges
  const federalCount = regulations.filter((r) => r.authority_type !== 'emirate').length;
  const emirateCount = regulations.filter((r) => r.authority_type === 'emirate').length;

  return (
    <div>
      {/* Active bans callout */}
      {activeNow.length > 0 && (
        <div className="mb-8 p-4 rounded-xl bg-red-950/60 border border-red-500/40">
          <div className="flex items-center gap-2 mb-2">
            <Ban className="w-4 h-4 text-red-400" />
            <span className="text-red-400 font-semibold text-sm">Active Right Now</span>
            <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
              {activeNow.length} regulation{activeNow.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-1">
            {activeNow.map((r) => (
              <p key={r.id} className="text-white text-sm">
                <span className="font-medium">{r.title}</span>
                {r.species_names.length > 0 && (
                  <span className="text-red-300"> — {r.species_names.join(', ')}</span>
                )}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Authority tabs */}
      <div className="flex gap-2 mb-4">
        {(
          [
            { key: 'all', label: `All (${regulations.length})` },
            { key: 'federal', label: `MOCCAE / Federal (${federalCount})` },
            { key: 'emirate', label: `Emirate Authorities (${emirateCount})` },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setAuthorityFilter(key)}
            className={`text-xs px-3.5 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
              authorityFilter === key
                ? 'bg-teal-500 border-teal-500 text-white'
                : 'border-white/20 text-gray-400 hover:border-teal-500/40'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by species, regulation type, authority, or legal reference..."
          className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 outline-none text-sm"
        />
      </div>

      {/* Type filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setTypeFilter('')}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            typeFilter === '' ? 'bg-teal-500 border-teal-500 text-white' : 'border-white/20 text-gray-400 hover:border-teal-500/40'
          }`}
        >
          All types
        </button>
        {REG_TYPES.map((type) => {
          const cfg = TYPE_CONFIG[type];
          const Icon = cfg.icon;
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(typeFilter === type ? '' : type)}
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                typeFilter === type ? 'bg-teal-500 border-teal-500 text-white' : 'border-white/20 text-gray-400 hover:border-teal-500/40'
              }`}
            >
              <Icon className="w-3 h-3" />
              {cfg.label}
            </button>
          );
        })}
      </div>

      <p className="text-gray-500 text-sm mb-4">
        {filtered.length} regulation{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Regulation cards */}
      <div className="space-y-3">
        {filtered.map((reg) => {
          const cfg = TYPE_CONFIG[reg.regulation_type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.general;
          const Icon = cfg.icon;
          const banPeriod = formatBanPeriod(reg);
          const activeBan = isBanActive(reg);
          const isOpen = expanded === reg.id;
          const isEmirate = reg.authority_type === 'emirate';

          return (
            <div
              key={reg.id}
              className="rounded-xl border border-white/10 bg-white/5 overflow-hidden hover:border-white/20 transition-colors"
            >
              <button
                onClick={() => setExpanded(isOpen ? null : reg.id)}
                className="w-full text-left p-5"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${cfg.bg}`}>
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      {activeBan && (
                        <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
                          ACTIVE NOW
                        </span>
                      )}
                      {banPeriod && (
                        <span className="text-xs text-gray-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                          {banPeriod}
                        </span>
                      )}
                      {isEmirate && reg.emirate && (
                        <span className="inline-flex items-center gap-1 text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                          <Building2 className="w-2.5 h-2.5" />
                          {reg.emirate}
                        </span>
                      )}
                      {reg.applies_to_coast && reg.applies_to_coast !== 'Both' && (
                        <span className="text-xs text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full">
                          {reg.applies_to_coast}
                        </span>
                      )}
                    </div>

                    <p className="text-white font-semibold text-sm mb-1.5">{reg.title}</p>

                    {/* Authority line */}
                    {reg.authority && (
                      <p className="text-xs text-gray-600 mb-1.5 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {reg.authority}
                      </p>
                    )}

                    {/* Species tags */}
                    {reg.species_names.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {reg.species_names.map((name) => (
                          <span
                            key={name}
                            className="inline-flex items-center gap-1 text-xs text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full"
                          >
                            <Fish className="w-2.5 h-2.5" />
                            {name}
                          </span>
                        ))}
                      </div>
                    )}
                    {reg.applies_to_all_species && reg.species_names.length === 0 && (
                      <span className="text-xs text-gray-500 italic">Applies to all species</span>
                    )}
                  </div>

                  <span className={`text-gray-500 shrink-0 transition-transform duration-200 text-lg leading-none ${isOpen ? 'rotate-180' : ''}`}>▾</span>
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-0 border-t border-white/10">
                  {reg.description && (
                    <p className="text-gray-300 text-sm leading-relaxed mt-4 mb-4">{reg.description}</p>
                  )}

                  {reg.notes && (
                    <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-200/80">{reg.notes}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-xs mb-4">
                    {reg.min_size_cm && (
                      <div>
                        <span className="text-gray-500">Minimum Size</span>
                        <p className="text-amber-400 font-semibold">{reg.min_size_cm} cm total length</p>
                      </div>
                    )}
                    {reg.ban_scope && reg.regulation_type === 'seasonal_ban' && (
                      <div>
                        <span className="text-gray-500">Ban Scope</span>
                        <p className="text-gray-300 capitalize">
                          {reg.ban_scope === 'all' ? 'Fishing + Trade (all origins)' : reg.ban_scope}
                        </p>
                      </div>
                    )}
                    {reg.ban_scope && reg.regulation_type === 'marine_protected_area' && (
                      <div>
                        <span className="text-gray-500">Restriction</span>
                        <p className="text-gray-300 capitalize">{reg.ban_scope}</p>
                      </div>
                    )}
                    {reg.authority && (
                      <div>
                        <span className="text-gray-500">Issuing Authority</span>
                        <p className="text-gray-300">{reg.authority}</p>
                      </div>
                    )}
                    {reg.legal_ref && (
                      <div>
                        <span className="text-gray-500">Legal Reference</span>
                        <p className="text-gray-300">{reg.legal_ref}</p>
                      </div>
                    )}
                    {reg.applies_to_coast && (
                      <div>
                        <span className="text-gray-500">Applies to</span>
                        <p className="text-gray-300">{reg.applies_to_coast} coastline</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 items-center">
                    {reg.species_slugs.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {reg.species_slugs.map((slug, idx) => (
                          <Link
                            key={slug}
                            href={`/species/${slug}`}
                            className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
                          >
                            → {reg.species_names[idx] ?? slug}
                          </Link>
                        ))}
                      </div>
                    )}
                    {reg.source_url && (
                      <a
                        href={reg.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors ml-auto"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Official Source
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No regulations match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
