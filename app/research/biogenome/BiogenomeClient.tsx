'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Dna, ExternalLink, ChevronDown, ChevronRight, BarChart3, GitBranch } from 'lucide-react';
import dynamic from 'next/dynamic';

const PhylogeneticTree = dynamic(() => import('./PhylogeneticTree'), { ssr: false });
const DistributionHeatmap = dynamic(() => import('./DistributionHeatmap'), { ssr: false });

export interface BiogenomeEntry {
  id: string;
  scientific_name: string;
  common_name: string | null;
  taxon_class: string | null;
  taxon_order: string | null;
  taxon_family: string;
  genome_size_gb: number | null;
  assembly_level: string;
  accession: string | null;
  sequencing_date: string | null;
  sequencing_centre: string | null;
  ebp_phase: number | null;
  conservation_status: string | null;
  native_to_uae: boolean;
  notes: string | null;
  species_slug: string | null;
}

const ASSEMBLY_BADGE: Record<string, string> = {
  'Chromosome':   'bg-teal-500/20 text-teal-400 border-teal-500/40',
  'Scaffold':     'bg-sky-500/20 text-sky-400 border-sky-500/40',
  'Contig':       'bg-amber-500/20 text-amber-400 border-amber-500/40',
  'Not sequenced':'bg-gray-700/60 text-gray-500 border-gray-600/40',
};

const ASSEMBLY_ORDER = ['Chromosome', 'Scaffold', 'Contig', 'Not sequenced'];

type ViewMode = 'table' | 'tree' | 'heatmap';

export default function BiogenomeClient({ entries }: { entries: BiogenomeEntry[] }) {
  const [query, setQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [familyFilter, setFamilyFilter] = useState('');
  const [assemblyFilter, setAssemblyFilter] = useState('');
  const [view, setView] = useState<ViewMode>('table');
  const [expanded, setExpanded] = useState<string | null>(null);

  const classes = useMemo(() => [...new Set(entries.map((e) => e.taxon_class ?? 'Unknown').filter(Boolean))].sort(), [entries]);
  const families = useMemo(() => [...new Set(entries.map((e) => e.taxon_family).filter(Boolean))].sort(), [entries]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return entries.filter((e) => {
      const matchQ = !q ||
        e.scientific_name.toLowerCase().includes(q) ||
        (e.common_name ?? '').toLowerCase().includes(q) ||
        e.taxon_family.toLowerCase().includes(q) ||
        (e.taxon_order ?? '').toLowerCase().includes(q) ||
        (e.accession ?? '').toLowerCase().includes(q);
      const matchClass = !classFilter || e.taxon_class === classFilter;
      const matchFamily = !familyFilter || e.taxon_family === familyFilter;
      const matchAssembly = !assemblyFilter || e.assembly_level === assemblyFilter;
      return matchQ && matchClass && matchFamily && matchAssembly;
    });
  }, [entries, query, classFilter, familyFilter, assemblyFilter]);

  // Summary stats
  const sequenced = entries.filter((e) => e.assembly_level !== 'Not sequenced').length;
  const chromosome = entries.filter((e) => e.assembly_level === 'Chromosome').length;

  function clearFilters() {
    setQuery('');
    setClassFilter('');
    setFamilyFilter('');
    setAssemblyFilter('');
  }

  const hasFilters = query || classFilter || familyFilter || assemblyFilter;

  return (
    <div>
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Species', value: entries.length, color: 'text-white' },
          { label: 'Genome Sequenced', value: sequenced, color: 'text-teal-400' },
          { label: 'Chromosome-Level', value: chromosome, color: 'text-sky-400' },
          { label: 'Families Covered', value: families.length, color: 'text-violet-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
            <p className="text-gray-500 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {([
          { id: 'table', icon: <Search className="w-3.5 h-3.5" />, label: 'Database' },
          { id: 'tree', icon: <GitBranch className="w-3.5 h-3.5" />, label: 'Phylogenetic Tree' },
          { id: 'heatmap', icon: <BarChart3 className="w-3.5 h-3.5" />, label: 'Distribution Heatmap' },
        ] as const).map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={`inline-flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-lg border transition-colors ${
              view === id
                ? 'bg-teal-500 border-teal-500 text-white'
                : 'border-white/20 text-gray-400 hover:border-teal-500/40 hover:text-white'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* ── TREE VIEW ── */}
      {view === 'tree' && (
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="text-white font-semibold mb-1">Phylogenetic Tree — UAE Marine Species</h3>
          <p className="text-gray-500 text-xs mb-4">Hover a leaf node to see sequencing status. Dot colour indicates assembly level.</p>
          <PhylogeneticTree entries={entries} />
        </div>
      )}

      {/* ── HEATMAP VIEW ── */}
      {view === 'heatmap' && (
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="text-white font-semibold mb-1">Species Distribution Heatmap — UAE Waters</h3>
          <p className="text-gray-500 text-xs mb-4">Estimated species richness and family diversity across UAE marine regions.</p>
          <DistributionHeatmap />
        </div>
      )}

      {/* ── TABLE VIEW ── */}
      {view === 'table' && (
        <>
          {/* Search + filters */}
          <div className="space-y-3 mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by scientific name, common name, family, or accession..."
                className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 outline-none text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              {/* Class filter */}
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none"
              >
                <option value="">All Classes</option>
                {classes.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>

              {/* Family filter */}
              <select
                value={familyFilter}
                onChange={(e) => setFamilyFilter(e.target.value)}
                className="bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none"
              >
                <option value="">All Families</option>
                {families.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>

              {/* Assembly level filter */}
              <div className="flex gap-1.5">
                {ASSEMBLY_ORDER.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAssemblyFilter(assemblyFilter === a ? '' : a)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      assemblyFilter === a
                        ? 'bg-teal-500 border-teal-500 text-white'
                        : 'border-white/20 text-gray-400 hover:border-teal-500/40'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>

              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-teal-400 hover:text-teal-300 ml-auto">
                  Clear all
                </button>
              )}
            </div>
          </div>

          <p className="text-gray-500 text-sm mb-4">{filtered.length} entries</p>

          {/* Table */}
          <div className="space-y-2">
            {filtered.map((entry) => {
              const isOpen = expanded === entry.id;
              const badgeClass = ASSEMBLY_BADGE[entry.assembly_level] ?? ASSEMBLY_BADGE['Not sequenced'];

              return (
                <div
                  key={entry.id}
                  className="rounded-xl border border-white/10 bg-white/5 overflow-hidden hover:border-teal-500/30 transition-colors"
                >
                  <button
                    onClick={() => setExpanded(isOpen ? null : entry.id)}
                    className="w-full text-left p-4"
                  >
                    <div className="flex items-start gap-3 flex-wrap sm:flex-nowrap">
                      {/* DNA icon */}
                      <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Dna className="w-4 h-4 text-teal-400" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="text-white font-medium text-sm italic">{entry.scientific_name}</p>
                          {entry.common_name && (
                            <span className="text-gray-400 text-xs">({entry.common_name})</span>
                          )}
                        </div>
                        <p className="text-gray-500 text-xs">
                          {[entry.taxon_class, entry.taxon_order, entry.taxon_family]
                            .filter(Boolean)
                            .join(' › ')}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {/* Assembly level badge */}
                        <span className={`text-xs border px-2.5 py-0.5 rounded-full font-medium ${badgeClass}`}>
                          {entry.assembly_level}
                        </span>
                        {/* Genome size */}
                        {entry.genome_size_gb && (
                          <span className="text-xs text-gray-500">
                            {entry.genome_size_gb} Gb
                          </span>
                        )}
                        {/* Phase */}
                        {entry.ebp_phase && (
                          <span className="text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                            Phase {entry.ebp_phase}
                          </span>
                        )}
                        <span className="text-gray-600">
                          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className="px-4 pb-4 pt-3 border-t border-white/10">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-xs mb-3">
                        {entry.accession && (
                          <div>
                            <span className="text-gray-500">Accession</span>
                            <p className="text-gray-300 font-mono">{entry.accession}</p>
                          </div>
                        )}
                        {entry.sequencing_date && (
                          <div>
                            <span className="text-gray-500">Sequencing Date</span>
                            <p className="text-gray-300">{entry.sequencing_date}</p>
                          </div>
                        )}
                        {entry.sequencing_centre && (
                          <div>
                            <span className="text-gray-500">Sequencing Centre</span>
                            <p className="text-gray-300">{entry.sequencing_centre}</p>
                          </div>
                        )}
                        {entry.conservation_status && (
                          <div>
                            <span className="text-gray-500">Conservation Status</span>
                            <p className="text-gray-300">{entry.conservation_status}</p>
                          </div>
                        )}
                      </div>

                      {entry.notes && (
                        <p className="text-gray-400 text-xs leading-relaxed mb-3">{entry.notes}</p>
                      )}

                      <div className="flex flex-wrap gap-3">
                        {entry.accession && (
                          <a
                            href={`https://www.ncbi.nlm.nih.gov/datasets/genome/${entry.accession}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View on NCBI
                          </a>
                        )}
                        {entry.species_slug && (
                          <Link
                            href={`/species/${entry.species_slug}`}
                            className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition-colors"
                          >
                            <ChevronRight className="w-3 h-3" />
                            Species Profile
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No entries match your search.</p>
                <button onClick={clearFilters} className="text-teal-400 hover:text-teal-300 text-sm mt-2">
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
