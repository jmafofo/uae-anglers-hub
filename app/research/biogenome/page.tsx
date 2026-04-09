import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Dna, Globe, BookOpen } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import BiogenomeClient, { type BiogenomeEntry } from './BiogenomeClient';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Earth Biogenome Project — UAE Marine Species | UAE Anglers Hub',
  description:
    'Explore genome sequencing status for UAE marine fish species under the Earth Biogenome Project. Phylogenetic trees, species distribution heatmaps, and a searchable sequencing database.',
};

async function getEntries(): Promise<BiogenomeEntry[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('biogenome_entries')
      .select('*')
      .order('taxon_class', { ascending: true })
      .order('taxon_order', { ascending: true })
      .order('taxon_family', { ascending: true })
      .order('scientific_name', { ascending: true });

    if (error) throw error;
    return (data ?? []) as BiogenomeEntry[];
  } catch {
    return [];
  }
}

export default async function BiogenomePage() {
  const entries = await getEntries();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section
        className="relative pt-28 pb-16 px-4"
        style={{
          background:
            'radial-gradient(ellipse at top left, rgba(99,102,241,0.15) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(0,212,170,0.10) 0%, transparent 50%), #0a0f1a',
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-6">
            <Link href="/research" className="hover:text-teal-400 transition-colors">Research</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-300">Earth Biogenome Project</span>
          </div>

          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 rounded-full px-4 py-1.5 text-violet-400 text-sm mb-6">
            <Dna className="w-4 h-4" />
            Earth Biogenome Project — UAE
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
            UAE Marine Species
            <br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #818cf8, #00d4aa)' }}>
              Genome Database
            </span>
          </h1>

          <p className="text-gray-400 text-lg max-w-2xl mb-8 leading-relaxed">
            Tracking the sequencing status and genomic data for UAE marine fish species
            under the{' '}
            <a
              href="https://www.earthbiogenome.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 underline underline-offset-2"
            >
              Earth Biogenome Project
            </a>
            . Explore the phylogenetic tree, distribution heatmap, and search the sequencing database.
          </p>

          {/* EBP context */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: <Globe className="w-5 h-5 text-violet-400" />,
                title: 'EBP Goal',
                desc: 'Sequence the genomes of all ~1.5 million known eukaryotic species on Earth within 10 years.',
              },
              {
                icon: <Dna className="w-5 h-5 text-teal-400" />,
                title: 'UAE Fish Genomes',
                desc: `${entries.filter((e) => e.assembly_level !== 'Not sequenced').length} of ${entries.length} tracked UAE species have genome assemblies available.`,
              },
              {
                icon: <BookOpen className="w-5 h-5 text-sky-400" />,
                title: 'Key Partners',
                desc: 'KAUST, Wellcome Sanger Institute, BGI Shenzhen, UAE University, and MBGD UAE.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="mb-2">{icon}</div>
                <h3 className="text-white font-semibold text-sm mb-1">{title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 pb-20 pt-10">
        {entries.length === 0 ? (
          <div className="text-center py-20">
            <Dna className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Database not yet populated.</p>
            <p className="text-gray-600 text-sm mt-2">
              Run the SQL migration in Supabase to seed the biogenome entries.
            </p>
            <Link
              href="/research"
              className="inline-flex items-center gap-2 mt-6 text-teal-400 hover:text-teal-300 text-sm"
            >
              <ChevronRight className="w-4 h-4" />
              Back to Research
            </Link>
          </div>
        ) : (
          <BiogenomeClient entries={entries} />
        )}
      </div>
    </div>
  );
}
