import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About UAE Anglers Hub',
  description:
    'Learn about UAE Anglers Hub, the UAE fishing community built to share marine data, conservation insights, and verified fishing information.',
  alternates: {
    canonical: 'https://uaeangler.com/about',
  },
};

export default function AboutPage() {
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
            About UAE Anglers Hub
          </h1>
          <p className="text-gray-400">Our mission, community, and the data behind the platform</p>
        </div>

        <div className="prose prose-invert prose-gray max-w-none">
          <p className="text-gray-300 leading-relaxed">
            <strong className="text-white">UAE Anglers Hub</strong> is the leading digital platform
            for recreational and sport anglers in the United Arab Emirates. We combine local
            knowledge, verified marine data, and modern technology to help fishermen of every level
            find spots, identify species, follow regulations, and contribute to the conservation of
            UAE waters.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">Why we built it</h2>
          <p className="text-gray-300 leading-relaxed">
            Fishing in the UAE has always relied on word-of-mouth: a friend mentioning a productive
            reef, a captain sharing a seasonal tip, or a social post that disappears within days.
            While this tradition creates strong bonds, it also leaves valuable information
            fragmented, unverified, and unavailable to newcomers.
          </p>
          <p className="text-gray-300 leading-relaxed mt-4">
            UAE Anglers Hub was created to solve that problem. We wanted one trusted place where
            anglers can discover detailed fishing spots across all seven emirates, understand which
            species are present at different times of year, and stay up to date with local rules and
            conservation programmes.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">Who it is for</h2>
          <p className="text-gray-300 leading-relaxed">
            The platform is designed for everyone who fishes UAE waters: shore anglers casting from
            Abu Dhabi breakwaters, kayak fishermen exploring the Eastern mangroves, deep-sea charter
            guests targeting pelagic species in Fujairah, and tournament competitors tracking their
            season. Whether you are planning your first trip or your five-hundredth, the hub is
            built to make your time on the water more productive, safer, and more rewarding.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">Marine data and conservation</h2>
          <p className="text-gray-300 leading-relaxed">
            At the core of UAE Anglers Hub is a commitment to marine data and conservation. Every
            catch log, species sighting, and spot review contributes to a growing dataset that helps
            researchers, conservation groups, and fisheries managers understand fish distribution,
            seasonal patterns, and population health across the Emirates.
          </p>
          <p className="text-gray-300 leading-relaxed mt-4">
            We work with publicly available regulatory information, peer-reviewed species data, and
            direct input from the local angling community. By turning individual fishing experiences
            into structured, anonymised records, we help transform recreational fishing into a
            citizen-science resource that supports sustainable management of UAE marine life.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">A community, not just a database</h2>
          <p className="text-gray-300 leading-relaxed">
            UAE Anglers Hub is driven by its community. Members share trip reports, ask questions,
            recommend tackle and bait, and warn each other about changing conditions. Our forum,
            tournaments, and charter listings connect anglers with each other and with local
            businesses that share our values of ethical, responsible fishing.
          </p>
          <p className="text-gray-300 leading-relaxed mt-4">
            We believe that the more anglers understand and care about the marine environment, the
            better stewards they become. That is why education, transparency, and respect for UAE
            regulations are woven into every feature we build.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">Operated by Black Pearl FZE LLC</h2>
          <p className="text-gray-300 leading-relaxed">
            UAE Anglers Hub is operated by <strong className="text-white">Black Pearl FZE LLC</strong>
            , a company registered in Ajman, United Arab Emirates. We are a small, dedicated team of
            anglers, developers, and conservation-minded professionals working to give back to the
            sport and the waters we fish.
          </p>
        </div>
      </div>
    </div>
  );
}
