import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Editorial Policy',
  description:
    'How UAE Anglers Hub sources, fact-checks, and updates fishing spots, species, regulations, and user-generated content.',
  alternates: {
    canonical: 'https://uaeangler.com/editorial-policy',
  },
};

export default function EditorialPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="mb-10">
          <Link
            href="/"
            className="text-teal-400 hover:text-teal-300 text-sm font-medium transition-colors"
          >
            &larr; Back to home
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-6 mb-2">
            Editorial Policy
          </h1>
          <p className="text-gray-400">How we source, verify, and maintain content</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 mb-10">
          <p className="text-gray-300 text-sm">
            <strong className="text-white">Effective Date:</strong> 25 May 2026
          </p>
          <p className="text-gray-300 text-sm mt-1">
            <strong className="text-white">Last Updated:</strong> 25 May 2026
          </p>
        </div>

        <div className="prose prose-invert prose-gray max-w-none">
          <p className="text-gray-300 leading-relaxed">
            UAE Anglers Hub is committed to accuracy, transparency, and trust. This Editorial Policy
            explains how we produce and maintain the information on our platform, from fishing spots
            and species pages to regulations and user-generated content.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">Fishing spots</h2>
          <p className="text-gray-300 leading-relaxed">
            Spot profiles are built from publicly available geographic data, local knowledge, and
            verified community reports. Each listing includes location, access type, typical species,
            best seasons, and recommended techniques. We do not publish sensitive locations that
            could harm marine ecosystems, and we avoid encouraging fishing in protected or restricted
            areas.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">Species information</h2>
          <p className="text-gray-300 leading-relaxed">
            Species descriptions, scientific names, size ranges, and identification tips are based on
            established marine biology references and peer-reviewed sources. Our AI identification
            tool provides a best-effort suggestion and is clearly labelled as advisory. Users should
            always confirm species identification before acting on conservation or regulatory
            guidance.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">Regulations</h2>
          <p className="text-gray-300 leading-relaxed">
            UAE fishing regulations are compiled from official government sources, including the
            Ministry of Climate Change and Environment and relevant emirate-level authorities. We
            review these pages regularly, but rules can change without notice. We recommend anglers
            verify current regulations with local authorities before fishing.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">Catch data and community reports</h2>
          <p className="text-gray-300 leading-relaxed">
            Catch logs, photos, forum posts, and reviews are submitted by users. We use automated
            checks and manual review to detect spam, misinformation, prohibited content, and
            potential regulatory violations. Inaccurate or harmful reports may be flagged, edited, or
            removed at our discretion.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">Fact-checking and updates</h2>
          <p className="text-gray-300 leading-relaxed">
            Our editorial team reviews core informational pages on a scheduled basis and updates them
            when new data, seasonal patterns, or regulatory changes become available. Community
            members can suggest corrections through our contact channels, and we aim to fix factual
            errors promptly.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">User-generated content moderation</h2>
          <ul className="space-y-2 text-gray-300 list-disc pl-5">
            <li>All submissions must comply with our Terms of Service.</li>
            <li>Content promoting illegal fishing, poaching, or harm to protected species is removed.</li>
            <li>We do not allow harassment, hate speech, spam, or misleading commercial claims.</li>
            <li>Repeated violations may result in account suspension or permanent bans.</li>
          </ul>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">Advertising and sponsored content</h2>
          <p className="text-gray-300 leading-relaxed">
            Advertising on UAE Anglers Hub is clearly labelled and kept separate from editorial
            content. Sponsored listings or partnerships do not influence our spot ratings, species
            facts, or conservation guidance. We maintain editorial independence in everything we
            publish.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">Contact us</h2>
          <p className="text-gray-300 leading-relaxed">
            If you notice an error or want to suggest an improvement, please contact us at{' '}
            <a
              href="mailto:info@uaeangler.com"
              className="text-teal-400 hover:text-teal-300 transition-colors"
            >
              info@uaeangler.com
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
