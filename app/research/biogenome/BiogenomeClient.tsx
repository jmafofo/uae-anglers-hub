'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Search, Dna, ExternalLink, ChevronDown, ChevronRight, BarChart3,
  GitBranch, FlaskConical, Microscope, Upload, Wrench, CheckCircle2,
  AlertCircle, Loader2,
} from 'lucide-react';
import dynamic from 'next/dynamic';

const PhylogeneticTree   = dynamic(() => import('./PhylogeneticTree'),   { ssr: false });
const DistributionHeatmap = dynamic(() => import('./DistributionHeatmap'), { ssr: false });

/* ──────────────────────────────────────────────────────────────
   Types
────────────────────────────────────────────────────────────── */
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

interface GenomeAssembly {
  id: string;
  species_name: string;
  scientific_name: string;
  family: string | null;
  habitat_category: string | null;
  coast: string | null;
  assembly_level: string;
  total_length_mb: number | null;
  n50_kb: number | null;
  scaffold_count: number | null;
  gc_content_pct: number | null;
  busco_complete_pct: number | null;
  busco_fragmented_pct: number | null;
  busco_missing_pct: number | null;
  busco_lineage: string | null;
  sequencing_tech: string[] | null;
  annotation_status: string | null;
  source: string;
  year_published: number | null;
  status: string;
}

/* ──────────────────────────────────────────────────────────────
   Constants
────────────────────────────────────────────────────────────── */
const ASSEMBLY_BADGE: Record<string, string> = {
  'Chromosome':    'bg-teal-500/20 text-teal-400 border-teal-500/40',
  'Scaffold':      'bg-sky-500/20 text-sky-400 border-sky-500/40',
  'Contig':        'bg-amber-500/20 text-amber-400 border-amber-500/40',
  'Not sequenced': 'bg-gray-700/60 text-gray-500 border-gray-600/40',
};

const ASSEMBLY_ORDER = ['Chromosome', 'Scaffold', 'Contig', 'Not sequenced'];

type ViewMode = 'table' | 'tree' | 'heatmap' | 'busco' | 'compare' | 'submit' | 'tools';

const TABS: { id: ViewMode; icon: React.ReactNode; label: string }[] = [
  { id: 'table',   icon: <Search       className="w-3.5 h-3.5" />, label: 'Database' },
  { id: 'tree',    icon: <GitBranch    className="w-3.5 h-3.5" />, label: 'Phylogeny' },
  { id: 'heatmap', icon: <BarChart3    className="w-3.5 h-3.5" />, label: 'Distribution' },
  { id: 'busco',   icon: <Microscope   className="w-3.5 h-3.5" />, label: 'BUSCO Quality' },
  { id: 'compare', icon: <FlaskConical className="w-3.5 h-3.5" />, label: 'Compare Genomes' },
  { id: 'submit',  icon: <Upload       className="w-3.5 h-3.5" />, label: 'Submit Sample' },
  { id: 'tools',   icon: <Wrench       className="w-3.5 h-3.5" />, label: 'Analysis Tools' },
];

/* ──────────────────────────────────────────────────────────────
   Helper — small donut SVG
────────────────────────────────────────────────────────────── */
function BuscoDonut({
  complete, fragmented, missing,
}: { complete: number; fragmented: number; missing: number }) {
  const r = 40; const cx = 50; const cy = 50;
  const circumference = 2 * Math.PI * r;

  const segs = [
    { pct: complete,    color: '#00d4aa' }, // teal
    { pct: fragmented,  color: '#f59e0b' }, // amber
    { pct: missing,     color: '#ef4444' }, // red
  ];

  let cumulative = 0;
  const arcs = segs.map(({ pct, color }) => {
    const dashLen = (pct / 100) * circumference;
    const dashOffset = circumference - cumulative * circumference / 100;
    cumulative += pct;
    return { dashLen, dashOffset, color };
  });

  return (
    <svg viewBox="0 0 100 100" className="w-24 h-24">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth="16" />
      {arcs.map(({ dashLen, dashOffset, color }, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeDasharray={`${dashLen} ${circumference - dashLen}`}
          strokeDashoffset={dashOffset}
          style={{ transformOrigin: '50% 50%', transform: 'rotate(-90deg)' }}
        />
      ))}
      <text x="50" y="54" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white">
        {Math.round(complete)}%
      </text>
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────
   Main component
────────────────────────────────────────────────────────────── */
export default function BiogenomeClient({ entries }: { entries: BiogenomeEntry[] }) {
  // ── Database view state ──────────────────────────────────────
  const [query, setQuery]               = useState('');
  const [classFilter, setClassFilter]   = useState('');
  const [familyFilter, setFamilyFilter] = useState('');
  const [assemblyFilter, setAssemblyFilter] = useState('');
  const [expanded, setExpanded]         = useState<string | null>(null);

  // ── Global view ──────────────────────────────────────────────
  const [view, setView] = useState<ViewMode>('table');

  // ── Genome assemblies (fetched client-side) ──────────────────
  const [assemblies, setAssemblies]     = useState<GenomeAssembly[]>([]);
  const [loadingAssemblies, setLoadingAssemblies] = useState(false);

  useEffect(() => {
    if (view === 'busco' || view === 'compare') {
      if (assemblies.length > 0) return;
      setLoadingAssemblies(true);
      fetch('/api/genomics?type=assemblies')
        .then((r) => r.json())
        .then((d) => setAssemblies(d.assemblies ?? []))
        .catch(() => {})
        .finally(() => setLoadingAssemblies(false));
    }
  }, [view, assemblies.length]);

  // ── Submit form state ────────────────────────────────────────
  const [form, setForm] = useState({
    submitter_name: '', submitter_email: '', institution: '',
    species_name: '', scientific_name: '', sample_type: 'tissue',
    tissue_type: '', preservation: '', collection_location: '',
    latitude: '', longitude: '', collection_date: '', depth_m: '',
    habitat_description: '', data_type: [] as string[],
    sequencing_platform: '', coverage_depth: '', sequence: '',
    marker_type: '', notes: '',
  });
  const [submitting, setSubmitting]     = useState(false);
  const [submitResult, setSubmitResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // ── Derived data ─────────────────────────────────────────────
  const classes  = useMemo(() => [...new Set(entries.map((e) => e.taxon_class ?? 'Unknown').filter(Boolean))].sort(), [entries]);
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
      const matchClass    = !classFilter    || e.taxon_class    === classFilter;
      const matchFamily   = !familyFilter   || e.taxon_family   === familyFilter;
      const matchAssembly = !assemblyFilter || e.assembly_level === assemblyFilter;
      return matchQ && matchClass && matchFamily && matchAssembly;
    });
  }, [entries, query, classFilter, familyFilter, assemblyFilter]);

  const sequenced   = entries.filter((e) => e.assembly_level !== 'Not sequenced').length;
  const chromosome  = entries.filter((e) => e.assembly_level === 'Chromosome').length;
  const hasFilters  = query || classFilter || familyFilter || assemblyFilter;

  function clearFilters() {
    setQuery(''); setClassFilter(''); setFamilyFilter(''); setAssemblyFilter('');
  }

  // ── Submit handler ───────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitResult(null);
    try {
      const body = {
        ...form,
        latitude:  form.latitude  ? Number(form.latitude)  : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
        depth_m:   form.depth_m   ? Number(form.depth_m)   : undefined,
        data_type: form.data_type.length ? form.data_type : ['barcode'],
      };
      const res = await fetch('/api/genomics/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (res.ok) {
        setSubmitResult({ ok: true, msg: `Submission received — ID: ${json.submission_id}` });
        setForm({
          submitter_name: '', submitter_email: '', institution: '',
          species_name: '', scientific_name: '', sample_type: 'tissue',
          tissue_type: '', preservation: '', collection_location: '',
          latitude: '', longitude: '', collection_date: '', depth_m: '',
          habitat_description: '', data_type: [],
          sequencing_platform: '', coverage_depth: '', sequence: '',
          marker_type: '', notes: '',
        });
      } else {
        setSubmitResult({ ok: false, msg: json.error ?? 'Submission failed' });
      }
    } catch {
      setSubmitResult({ ok: false, msg: 'Network error — please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  function toggleDataType(dt: string) {
    setForm((f) => ({
      ...f,
      data_type: f.data_type.includes(dt)
        ? f.data_type.filter((x) => x !== dt)
        : [...f.data_type, dt],
    }));
  }

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div>
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Species',      value: entries.length, color: 'text-white' },
          { label: 'Genome Sequenced',   value: sequenced,      color: 'text-teal-400' },
          { label: 'Chromosome-Level',   value: chromosome,     color: 'text-sky-400' },
          { label: 'Families Covered',   value: families.length, color: 'text-violet-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
            <p className="text-gray-500 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {TABS.map(({ id, icon, label }) => (
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

      {/* ── PHYLOGENETIC TREE ── */}
      {view === 'tree' && (
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="text-white font-semibold mb-1">Phylogenetic Tree — UAE Marine Species</h3>
          <p className="text-gray-500 text-xs mb-4">Hover a leaf node to see sequencing status. Dot colour indicates assembly level.</p>
          <PhylogeneticTree entries={entries} />
        </div>
      )}

      {/* ── DISTRIBUTION HEATMAP ── */}
      {view === 'heatmap' && (
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="text-white font-semibold mb-1">Species Distribution Heatmap — UAE Waters</h3>
          <p className="text-gray-500 text-xs mb-4">Estimated species richness and family diversity across UAE marine regions.</p>
          <DistributionHeatmap />
        </div>
      )}

      {/* ── DATABASE TABLE ── */}
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
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none"
              >
                <option value="">All Classes</option>
                {classes.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>

              <select
                value={familyFilter}
                onChange={(e) => setFamilyFilter(e.target.value)}
                className="bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none"
              >
                <option value="">All Families</option>
                {families.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>

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

          <div className="space-y-2">
            {filtered.map((entry) => {
              const isOpen    = expanded === entry.id;
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
                          {[entry.taxon_class, entry.taxon_order, entry.taxon_family].filter(Boolean).join(' › ')}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <span className={`text-xs border px-2.5 py-0.5 rounded-full font-medium ${badgeClass}`}>
                          {entry.assembly_level}
                        </span>
                        {entry.genome_size_gb && (
                          <span className="text-xs text-gray-500">{entry.genome_size_gb} Gb</span>
                        )}
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
                            target="_blank" rel="noopener noreferrer"
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

      {/* ── BUSCO QUALITY ── */}
      {view === 'busco' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="text-white font-semibold mb-1">BUSCO Genome Completeness</h3>
            <p className="text-gray-500 text-xs mb-4">
              BUSCO (Benchmarking Universal Single-Copy Orthologs) measures genome assembly completeness
              against the <span className="text-teal-400 font-mono">actinopterygii_odb10</span> lineage dataset.
              High complete % indicates a high-quality, well-assembled genome.
            </p>

            {/* Legend */}
            <div className="flex gap-4 mb-6 text-xs flex-wrap">
              {[
                { color: 'bg-teal-400', label: 'Complete' },
                { color: 'bg-amber-400', label: 'Fragmented' },
                { color: 'bg-red-500',  label: 'Missing' },
              ].map(({ color, label }) => (
                <span key={label} className="flex items-center gap-1.5 text-gray-400">
                  <span className={`w-3 h-3 rounded-sm ${color}`} />
                  {label}
                </span>
              ))}
            </div>

            {loadingAssemblies ? (
              <div className="flex items-center gap-3 text-gray-400 py-8">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading genome assemblies…
              </div>
            ) : assemblies.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No published genome assemblies found. Run the SQL migration to seed the database.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {assemblies
                  .filter((a) => a.busco_complete_pct != null)
                  .sort((a, b) => (b.busco_complete_pct ?? 0) - (a.busco_complete_pct ?? 0))
                  .map((a) => {
                    const comp = a.busco_complete_pct ?? 0;
                    const frag = a.busco_fragmented_pct ?? 0;
                    const miss = a.busco_missing_pct   ?? 0;
                    const qualColor =
                      comp >= 90 ? 'text-teal-400' :
                      comp >= 75 ? 'text-amber-400' : 'text-red-400';

                    return (
                      <div key={a.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-start justify-between mb-3 gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{a.species_name}</p>
                            <p className="text-gray-500 text-xs italic truncate">{a.scientific_name}</p>
                            <div className="flex gap-1.5 mt-1 flex-wrap">
                              {a.habitat_category && (
                                <span className="text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-full">
                                  {a.habitat_category}
                                </span>
                              )}
                              <span className="text-xs bg-white/5 text-gray-400 border border-white/10 px-2 py-0.5 rounded-full">
                                {a.assembly_level}
                              </span>
                            </div>
                          </div>
                          <BuscoDonut complete={comp} fragmented={frag} missing={miss} />
                        </div>

                        {/* Stacked bar */}
                        <div className="h-2 rounded-full overflow-hidden flex mb-2">
                          <div style={{ width: `${comp}%` }}  className="bg-teal-400" />
                          <div style={{ width: `${frag}%` }}  className="bg-amber-400" />
                          <div style={{ width: `${miss}%` }}  className="bg-red-500" />
                        </div>

                        <div className="grid grid-cols-3 text-xs text-center mt-2">
                          <div>
                            <p className={`font-bold ${qualColor}`}>{comp.toFixed(1)}%</p>
                            <p className="text-gray-500">Complete</p>
                          </div>
                          <div>
                            <p className="font-bold text-amber-400">{frag.toFixed(1)}%</p>
                            <p className="text-gray-500">Frag.</p>
                          </div>
                          <div>
                            <p className="font-bold text-red-400">{miss.toFixed(1)}%</p>
                            <p className="text-gray-500">Missing</p>
                          </div>
                        </div>

                        {a.sequencing_tech && a.sequencing_tech.length > 0 && (
                          <p className="text-gray-600 text-xs mt-2 truncate">
                            {a.sequencing_tech.join(', ')}
                          </p>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── COMPARE GENOMES ── */}
      {view === 'compare' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="text-white font-semibold mb-1">Genome Size &amp; Quality Comparison</h3>
            <p className="text-gray-500 text-xs mb-6">
              Bar length = genome size (Mb). Bar colour reflects BUSCO completeness grade.
              N50 shown for scaffold continuity. Longer N50 = fewer, larger scaffolds = better assembly.
            </p>

            {loadingAssemblies ? (
              <div className="flex items-center gap-3 text-gray-400 py-8">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading genome assemblies…
              </div>
            ) : assemblies.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No published genome assemblies found.
              </div>
            ) : (() => {
              const maxSize = Math.max(...assemblies.filter((a) => a.total_length_mb != null).map((a) => a.total_length_mb!));
              const sorted  = [...assemblies]
                .filter((a) => a.total_length_mb != null)
                .sort((a, b) => (b.total_length_mb ?? 0) - (a.total_length_mb ?? 0));

              return (
                <div className="space-y-3">
                  {sorted.map((a) => {
                    const pct  = ((a.total_length_mb ?? 0) / maxSize) * 100;
                    const comp = a.busco_complete_pct ?? 0;
                    const barColor =
                      comp >= 90 ? '#00d4aa' :
                      comp >= 75 ? '#f59e0b' :
                      comp > 0   ? '#ef4444' : '#4b5563';

                    return (
                      <div key={a.id} className="grid grid-cols-[1fr_auto] gap-3 items-center">
                        <div>
                          <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                            <span className="text-white text-sm font-medium">{a.species_name}</span>
                            <span className="text-gray-500 text-xs italic">{a.scientific_name}</span>
                          </div>
                          <div className="h-5 rounded-full bg-white/5 overflow-hidden relative">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, backgroundColor: barColor }}
                            />
                            <span className="absolute inset-y-0 left-2 flex items-center text-xs font-mono text-white/80">
                              {a.total_length_mb} Mb
                            </span>
                          </div>
                        </div>

                        <div className="text-right text-xs space-y-0.5 min-w-[80px]">
                          {a.n50_kb != null && (
                            <p className="text-sky-400 font-mono">N50: {a.n50_kb} kb</p>
                          )}
                          {a.busco_complete_pct != null && (
                            <p className="text-gray-400">BUSCO: <span style={{ color: barColor }}>{comp.toFixed(0)}%</span></p>
                          )}
                          {a.gc_content_pct != null && (
                            <p className="text-gray-500">GC: {a.gc_content_pct}%</p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Habitat group breakdown */}
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <h4 className="text-white text-sm font-semibold mb-4">Assemblies by Habitat</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {Array.from(new Set(assemblies.map((a) => a.habitat_category).filter(Boolean))).map((habitat) => {
                        const count = assemblies.filter((a) => a.habitat_category === habitat).length;
                        const avgBusco = assemblies
                          .filter((a) => a.habitat_category === habitat && a.busco_complete_pct != null)
                          .reduce((sum, a, _, arr) => sum + (a.busco_complete_pct ?? 0) / arr.length, 0);

                        return (
                          <div key={habitat!} className="p-3 rounded-lg bg-white/5 border border-white/10">
                            <p className="text-white text-sm font-medium">{habitat}</p>
                            <p className="text-teal-400 text-lg font-bold">{count}</p>
                            <p className="text-gray-500 text-xs">assemblies</p>
                            {avgBusco > 0 && (
                              <p className="text-xs text-amber-400 mt-1">Avg BUSCO: {avgBusco.toFixed(0)}%</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── COMMUNITY SUBMIT ── */}
      {view === 'submit' && (
        <div className="max-w-3xl">
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                <Upload className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Submit a Genomic Sample</h3>
                <p className="text-gray-500 text-sm mt-0.5">
                  Contribute your UAE marine fish genomic data for curator review. Accepted samples are
                  integrated into the community database and credited to your institution.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-400">
              {[
                '✦ All sample types accepted (tissue, eDNA, barcodes)',
                '✦ Raw sequences or metadata — both welcome',
                '✦ Curator review within 5–10 business days',
              ].map((t) => <p key={t}>{t}</p>)}
            </div>
          </div>

          {submitResult && (
            <div className={`flex items-start gap-3 p-4 rounded-xl border mb-6 ${
              submitResult.ok
                ? 'bg-teal-500/10 border-teal-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              {submitResult.ok
                ? <CheckCircle2 className="w-5 h-5 text-teal-400 mt-0.5 shrink-0" />
                : <AlertCircle  className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />}
              <p className={`text-sm ${submitResult.ok ? 'text-teal-300' : 'text-red-300'}`}>
                {submitResult.msg}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Submitter info */}
            <fieldset className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-4">
              <legend className="text-white font-semibold text-sm px-1">Submitter Information</legend>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Full Name *</label>
                  <input
                    required
                    value={form.submitter_name}
                    onChange={(e) => setForm({ ...form, submitter_name: e.target.value })}
                    className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-3 py-2 text-white text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Email *</label>
                  <input
                    required type="email"
                    value={form.submitter_email}
                    onChange={(e) => setForm({ ...form, submitter_email: e.target.value })}
                    className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-3 py-2 text-white text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-xs mb-1">Institution / Organisation</label>
                <input
                  value={form.institution}
                  onChange={(e) => setForm({ ...form, institution: e.target.value })}
                  placeholder="e.g. KAUST, UAE University, MBGD…"
                  className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-3 py-2 text-white text-sm outline-none"
                />
              </div>
            </fieldset>

            {/* Sample info */}
            <fieldset className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-4">
              <legend className="text-white font-semibold text-sm px-1">Sample Information</legend>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Species Common Name *</label>
                  <input
                    required
                    value={form.species_name}
                    onChange={(e) => setForm({ ...form, species_name: e.target.value })}
                    placeholder="e.g. Yellowfin Tuna"
                    className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-3 py-2 text-white text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Scientific Name</label>
                  <input
                    value={form.scientific_name}
                    onChange={(e) => setForm({ ...form, scientific_name: e.target.value })}
                    placeholder="e.g. Thunnus albacares"
                    className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-3 py-2 text-white text-sm outline-none italic"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Sample Type *</label>
                  <select
                    required
                    value={form.sample_type}
                    onChange={(e) => setForm({ ...form, sample_type: e.target.value })}
                    className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-3 py-2 text-white text-sm outline-none"
                  >
                    {['tissue', 'eDNA', 'blood', 'scale', 'fin_clip', 'water'].map((t) => (
                      <option key={t} value={t}>{t.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Tissue Type</label>
                  <select
                    value={form.tissue_type}
                    onChange={(e) => setForm({ ...form, tissue_type: e.target.value })}
                    className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-3 py-2 text-white text-sm outline-none"
                  >
                    <option value="">Select…</option>
                    {['liver', 'muscle', 'fin', 'blood', 'other'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-xs mb-1">Preservation Method</label>
                <select
                  value={form.preservation}
                  onChange={(e) => setForm({ ...form, preservation: e.target.value })}
                  className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-3 py-2 text-white text-sm outline-none"
                >
                  <option value="">Select…</option>
                  {['ethanol_95', 'RNAlater', 'frozen', 'DMSO', 'dried'].map((p) => (
                    <option key={p} value={p}>{p.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
            </fieldset>

            {/* Collection metadata */}
            <fieldset className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-4">
              <legend className="text-white font-semibold text-sm px-1">Collection Metadata</legend>

              <div>
                <label className="block text-gray-400 text-xs mb-1">Collection Location</label>
                <input
                  value={form.collection_location}
                  onChange={(e) => setForm({ ...form, collection_location: e.target.value })}
                  placeholder="e.g. Abu Dhabi coast, Persian Gulf"
                  className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-3 py-2 text-white text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Latitude</label>
                  <input
                    type="number" step="any"
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                    placeholder="24.46"
                    className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-3 py-2 text-white text-sm outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Longitude</label>
                  <input
                    type="number" step="any"
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                    placeholder="54.37"
                    className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-3 py-2 text-white text-sm outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Collection Date</label>
                  <input
                    type="date"
                    value={form.collection_date}
                    onChange={(e) => setForm({ ...form, collection_date: e.target.value })}
                    className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-3 py-2 text-white text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Depth (m)</label>
                  <input
                    type="number" step="0.1"
                    value={form.depth_m}
                    onChange={(e) => setForm({ ...form, depth_m: e.target.value })}
                    placeholder="15"
                    className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-3 py-2 text-white text-sm outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-xs mb-1">Habitat Description</label>
                <textarea
                  rows={2}
                  value={form.habitat_description}
                  onChange={(e) => setForm({ ...form, habitat_description: e.target.value })}
                  placeholder="e.g. Coral reef at 12 m depth, high turbidity…"
                  className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-3 py-2 text-white text-sm outline-none resize-none"
                />
              </div>
            </fieldset>

            {/* Genomics data */}
            <fieldset className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-4">
              <legend className="text-white font-semibold text-sm px-1">Genomic Data</legend>

              <div>
                <label className="block text-gray-400 text-xs mb-2">Data Type * (select all that apply)</label>
                <div className="flex flex-wrap gap-2">
                  {['whole_genome', 'barcode', 'SNP_panel', 'transcriptome'].map((dt) => (
                    <button
                      key={dt} type="button"
                      onClick={() => toggleDataType(dt)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        form.data_type.includes(dt)
                          ? 'bg-teal-500 border-teal-500 text-white'
                          : 'border-white/20 text-gray-400 hover:border-teal-500/40'
                      }`}
                    >
                      {dt.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Sequencing Platform</label>
                  <input
                    value={form.sequencing_platform}
                    onChange={(e) => setForm({ ...form, sequencing_platform: e.target.value })}
                    placeholder="e.g. Illumina NovaSeq, PacBio HiFi"
                    className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-3 py-2 text-white text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Coverage Depth</label>
                  <input
                    value={form.coverage_depth}
                    onChange={(e) => setForm({ ...form, coverage_depth: e.target.value })}
                    placeholder="e.g. 30×, 60×"
                    className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-3 py-2 text-white text-sm outline-none"
                  />
                </div>
              </div>

              {/* Direct barcode paste */}
              <div className="pt-2 border-t border-white/10">
                <label className="block text-gray-300 text-xs font-medium mb-1">
                  Paste Barcode Sequence (optional)
                </label>
                <p className="text-gray-500 text-xs mb-2">
                  If you have a COI / 16S / 12S barcode sequence, paste it here. It will be added to
                  the DNA barcode database pending curator approval.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Marker Type</label>
                    <select
                      value={form.marker_type}
                      onChange={(e) => setForm({ ...form, marker_type: e.target.value })}
                      className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-3 py-2 text-white text-sm outline-none"
                    >
                      <option value="">Select…</option>
                      {['COI', '16S', '12S', 'cytb', 'ITS2', 'NADH'].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <textarea
                  rows={4}
                  value={form.sequence}
                  onChange={(e) => setForm({ ...form, sequence: e.target.value })}
                  placeholder="ATGCGATCGATCG…  (A T C G N R Y W S K M B D H V only)"
                  className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-3 py-2 text-white text-sm outline-none resize-none font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs mb-1">Additional Notes</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any additional context, data availability, previous publications…"
                  className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-3 py-2 text-white text-sm outline-none resize-none"
                />
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</>
              ) : (
                <><Upload className="w-4 h-4" />Submit Sample</>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ── ANALYSIS TOOLS ── */}
      {view === 'tools' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="text-white font-semibold mb-1">Bioinformatics Analysis Tools</h3>
            <p className="text-gray-500 text-xs mb-6">
              External resources for sequence analysis, species identification, phylogenetics, and
              comparative genomics. All tools are free to use for research purposes.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  name: 'NCBI BLAST',
                  category: 'Sequence Search',
                  desc: 'Basic Local Alignment Search Tool — find similar sequences in GenBank. Use BLASTn for nucleotides, BLASTp for proteins.',
                  url: 'https://blast.ncbi.nlm.nih.gov/Blast.cgi',
                  color: 'text-teal-400',
                  bg: 'bg-teal-500/10 border-teal-500/20',
                },
                {
                  name: 'BOLD Systems',
                  category: 'DNA Barcoding',
                  desc: 'Barcode of Life Data System — species identification via COI barcodes. Includes UAE fish reference library.',
                  url: 'https://www.boldsystems.org/index.php/IDS_OpenIdEngine',
                  color: 'text-sky-400',
                  bg: 'bg-sky-500/10 border-sky-500/20',
                },
                {
                  name: 'MAFFT',
                  category: 'Multiple Alignment',
                  desc: 'Fast and accurate multiple sequence alignment. Use for comparing barcode sequences across species or populations.',
                  url: 'https://mafft.cbrc.jp/alignment/server/',
                  color: 'text-violet-400',
                  bg: 'bg-violet-500/10 border-violet-500/20',
                },
                {
                  name: 'Galaxy Project',
                  category: 'Genome Analysis',
                  desc: 'Open bioinformatics platform — assemble, annotate and compare genomes without command-line. Free compute for research.',
                  url: 'https://usegalaxy.org/',
                  color: 'text-amber-400',
                  bg: 'bg-amber-500/10 border-amber-500/20',
                },
                {
                  name: 'Ensembl',
                  category: 'Genome Browser',
                  desc: 'Browse annotated fish genomes, compare synteny across species. Supports Danio rerio and several teleost reference genomes.',
                  url: 'https://www.ensembl.org/index.html',
                  color: 'text-rose-400',
                  bg: 'bg-rose-500/10 border-rose-500/20',
                },
                {
                  name: 'NCBI Datasets',
                  category: 'Data Download',
                  desc: 'Download genome assemblies, annotation data and sequence records for any accession in the EBP / NCBI database.',
                  url: 'https://www.ncbi.nlm.nih.gov/datasets/',
                  color: 'text-indigo-400',
                  bg: 'bg-indigo-500/10 border-indigo-500/20',
                },
                {
                  name: 'BUSCO',
                  category: 'Assembly QC',
                  desc: 'Assess genome/proteome completeness using single-copy ortholog sets. Use actinopterygii_odb10 for UAE fish species.',
                  url: 'https://busco.ezlab.org/',
                  color: 'text-emerald-400',
                  bg: 'bg-emerald-500/10 border-emerald-500/20',
                },
                {
                  name: 'IQ-TREE 2',
                  category: 'Phylogenetics',
                  desc: 'Maximum likelihood phylogenetic inference. Build molecular phylogenies from barcode or whole-genome alignment data.',
                  url: 'http://www.iqtree.org/',
                  color: 'text-orange-400',
                  bg: 'bg-orange-500/10 border-orange-500/20',
                },
                {
                  name: 'TreeBASE',
                  category: 'Phylogeny Archive',
                  desc: 'Repository of published phylogenetic matrices and trees. Search for existing UAE/Indian Ocean fish phylogenies.',
                  url: 'https://treebase.org/',
                  color: 'text-cyan-400',
                  bg: 'bg-cyan-500/10 border-cyan-500/20',
                },
                {
                  name: 'FishBase',
                  category: 'Species Reference',
                  desc: 'Comprehensive species reference for fish — ecology, distribution, genetics and literature for all UAE marine species.',
                  url: 'https://www.fishbase.org/',
                  color: 'text-blue-400',
                  bg: 'bg-blue-500/10 border-blue-500/20',
                },
              ].map((tool) => (
                <a
                  key={tool.name}
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group p-4 rounded-xl border ${tool.bg} hover:scale-[1.01] transition-transform`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className={`font-semibold text-sm ${tool.color}`}>{tool.name}</p>
                      <p className="text-gray-500 text-xs">{tool.category}</p>
                    </div>
                    <ExternalLink className={`w-4 h-4 ${tool.color} opacity-60 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5`} />
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed">{tool.desc}</p>
                </a>
              ))}
            </div>

            {/* EBP quick links */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <h4 className="text-white text-sm font-semibold mb-3">EBP Project Links</h4>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'Earth Biogenome Project',   url: 'https://www.earthbiogenome.org/' },
                  { label: 'GoaT — Genomes on a Tree',  url: 'https://goat.genomehubs.org/' },
                  { label: 'ERGA',                      url: 'https://www.erga-biodiversity.eu/' },
                  { label: 'Vertebrate Genomes Project', url: 'https://vertebrategenomesproject.org/' },
                  { label: 'KAUST Red Sea Genomics',     url: 'https://www.kaust.edu.sa/en/research/core-labs/redbio' },
                ].map(({ label, url }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-full transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
