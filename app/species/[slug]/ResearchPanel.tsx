'use client';

import { useEffect, useState } from 'react';
import { BookOpen, ExternalLink, Tag, FileText, BarChart3, BookMarked } from 'lucide-react';

interface ResearchPaper {
  id: string;
  species_slug: string;
  title: string;
  authors: string | null;
  journal: string | null;
  year: number | null;
  doi: string | null;
  url: string | null;
  abstract: string | null;
  tags: string[];
  source_type: string;
}

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  journal: <BookOpen className="w-3.5 h-3.5" />,
  report: <FileText className="w-3.5 h-3.5" />,
  dataset: <BarChart3 className="w-3.5 h-3.5" />,
  book: <BookMarked className="w-3.5 h-3.5" />,
};

const SOURCE_COLORS: Record<string, string> = {
  journal: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
  report: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  dataset: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  book: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
};

const TAG_COLORS = [
  'text-sky-400 bg-sky-500/10',
  'text-emerald-400 bg-emerald-500/10',
  'text-violet-400 bg-violet-500/10',
  'text-rose-400 bg-rose-500/10',
  'text-amber-400 bg-amber-500/10',
];

export default function ResearchPanel({ slug }: { slug: string }) {
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/species-research/${slug}`)
      .then((r) => r.json())
      .then(({ papers }) => setPapers(papers ?? []))
      .catch(() => setPapers([]))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Research Papers</h2>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (papers.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Research Papers</h2>
        <div className="p-5 rounded-xl bg-white/5 border border-white/10 text-center">
          <BookOpen className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No indexed research papers yet for this species.</p>
          <p className="text-gray-600 text-xs mt-1">Research papers are added continuously.</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Research Papers</h2>
        <span className="text-xs text-gray-500 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
          {papers.length} {papers.length === 1 ? 'study' : 'studies'}
        </span>
      </div>

      <div className="space-y-3">
        {papers.map((paper) => {
          const isOpen = expanded === paper.id;
          const sourceColor = SOURCE_COLORS[paper.source_type] ?? SOURCE_COLORS.journal;
          const sourceIcon = SOURCE_ICONS[paper.source_type] ?? SOURCE_ICONS.journal;

          return (
            <div
              key={paper.id}
              className="rounded-xl border border-white/10 bg-white/5 overflow-hidden hover:border-teal-500/30 transition-colors"
            >
              <button
                onClick={() => setExpanded(isOpen ? null : paper.id)}
                className="w-full text-left p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Source type + year */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 text-xs border px-2 py-0.5 rounded-full ${sourceColor}`}>
                        {sourceIcon}
                        <span className="capitalize">{paper.source_type}</span>
                      </span>
                      {paper.year && (
                        <span className="text-xs text-gray-500">{paper.year}</span>
                      )}
                    </div>

                    {/* Title */}
                    <p className="text-sm font-medium text-white leading-snug mb-1.5">
                      {paper.title}
                    </p>

                    {/* Authors + Journal */}
                    {(paper.authors || paper.journal) && (
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {paper.authors}
                        {paper.authors && paper.journal && ' · '}
                        {paper.journal && <em>{paper.journal}</em>}
                      </p>
                    )}
                  </div>

                  {/* Expand indicator */}
                  <span className={`text-gray-500 shrink-0 mt-0.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    ▾
                  </span>
                </div>

                {/* Tags */}
                {paper.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {paper.tags.map((tag, idx) => (
                      <span
                        key={tag}
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${TAG_COLORS[idx % TAG_COLORS.length]}`}
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>

              {/* Expanded: abstract + DOI link */}
              {isOpen && (
                <div className="px-4 pb-4 border-t border-white/10 pt-3">
                  {paper.abstract && (
                    <p className="text-gray-400 text-sm leading-relaxed mb-3">
                      {paper.abstract}
                    </p>
                  )}
                  {(paper.doi || paper.url) && (
                    <a
                      href={paper.url ?? `https://doi.org/${paper.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {paper.doi ? `DOI: ${paper.doi}` : 'View Source'}
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
