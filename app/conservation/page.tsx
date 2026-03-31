import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, AlertTriangle, Fish, MapPin, Phone, ExternalLink, CheckCircle, XCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'UAE Fishing Regulations & Conservation — Fish Responsibly',
  description:
    'UAE fishing regulations, license requirements, size limits, protected species, marine protected areas, and responsible fishing best practices. Stay compliant with MOCCAE guidelines.',
};

export default function ConservationPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section
        className="relative pt-28 pb-16 px-4"
        style={{
          background: 'radial-gradient(ellipse at center top, rgba(0,128,100,0.15) 0%, transparent 60%), #0a0f1a',
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 rounded-full px-4 py-1.5 text-teal-400 text-sm mb-6">
            <ShieldCheck className="w-4 h-4" />
            UAE Fishing Regulations
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
            Fish UAE Waters Responsibly
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Know the rules, protect the fish, preserve the ocean for future generations.
            UAE fishing regulations are enforced by the Ministry of Climate Change and Environment (MOCCAE).
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 pb-16 space-y-14">
        {/* License Requirements */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">License Requirements</h2>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium">Recreational Fishing License Required</p>
                  <p className="text-gray-400 text-sm mt-0.5">
                    All recreational anglers fishing in UAE waters must obtain a license from the Ministry
                    of Climate Change and Environment (MOCCAE). Apply via the MOCCAE website or approved service centres.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium">UAE Nationals & Residents</p>
                  <p className="text-gray-400 text-sm mt-0.5">
                    Both UAE nationals and expatriate residents require a valid recreational fishing permit.
                    Licenses are typically issued annually.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium">Boat Fishing</p>
                  <p className="text-gray-400 text-sm mt-0.5">
                    Charter boat fishing requires the operator to hold a commercial fishing license.
                    Always check your charter operator is properly licensed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bag Limits & Size Limits */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Fish className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Bag & Size Limits</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-gray-400 font-medium pb-3">Species</th>
                  <th className="text-left text-gray-400 font-medium pb-3">Daily Bag Limit</th>
                  <th className="text-left text-gray-400 font-medium pb-3">Min Size</th>
                  <th className="text-left text-gray-400 font-medium pb-3">Notes</th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                {[
                  { species: 'Hammour (Grouper)', bag: '5 per day', size: '30 cm', notes: 'Release undersized fish carefully' },
                  { species: 'Kingfish (Narrow-barred Mackerel)', bag: '10 per day', size: '45 cm', notes: 'Most popular UAE species' },
                  { species: 'Sea Bream (Shaari)', bag: '15 per day', size: '20 cm', notes: 'Common shore fishing target' },
                  { species: 'Emperor Fish (Bayadh)', bag: '10 per day', size: '25 cm', notes: 'Highly valued food fish' },
                  { species: 'Barracuda', bag: '5 per day', size: '40 cm', notes: 'Caution: ciguatera risk in large fish' },
                  { species: 'Queenfish', bag: '10 per day', size: '35 cm', notes: 'Popular sport fish' },
                  { species: 'Giant Trevally', bag: '5 per day', size: '40 cm', notes: 'Excellent sport fish; consider catch & release' },
                ].map((row) => (
                  <tr key={row.species} className="border-b border-white/5">
                    <td className="text-white py-3">{row.species}</td>
                    <td className="text-teal-400 py-3">{row.bag}</td>
                    <td className="text-yellow-400 py-3">{row.size}</td>
                    <td className="text-gray-400 py-3">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-gray-500 text-xs mt-3">
            * Limits are indicative based on MOCCAE guidelines. Always verify current regulations at moccae.gov.ae
          </p>
        </section>

        {/* Prohibited Methods */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Prohibited Methods & Gear</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: 'Dynamite / Explosives', desc: 'Fishing with explosives is a serious criminal offense in the UAE, carrying heavy fines and imprisonment.' },
              { title: 'Poison / Chemicals', desc: 'Using any chemical or toxic substance to stun or kill fish is strictly prohibited.' },
              { title: 'Drag Nets in Shallow Waters', desc: 'Certain drag and seine nets are banned in shallow coastal areas and near coral reefs.' },
              { title: 'Trawling near Reefs', desc: 'Bottom trawling near coral reef ecosystems is prohibited to protect habitat.' },
              { title: 'Spearfishing with SCUBA', desc: 'Spearfishing while using SCUBA equipment is prohibited. Freediving spearfishing has restrictions.' },
              { title: 'Coral Harvesting', desc: 'Collecting, damaging, or possessing coral is illegal throughout UAE waters.' },
            ].map(({ title, desc }) => (
              <div key={title} className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium text-sm">{title}</p>
                  <p className="text-gray-400 text-xs mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Seasonal Closures */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Seasonal Closures</h2>
          </div>
          <div className="p-6 rounded-2xl bg-yellow-500/5 border border-yellow-500/20 space-y-4">
            <div>
              <p className="text-white font-medium">Hammour (Grouper) — Breeding Season</p>
              <p className="text-gray-400 text-sm mt-1">
                MOCCAE periodically declares closed seasons for Hammour to protect breeding populations.
                Closures are typically announced with several weeks&apos; notice. Follow official MOCCAE announcements.
              </p>
            </div>
            <div>
              <p className="text-white font-medium">Shrimp Trawling Season</p>
              <p className="text-gray-400 text-sm mt-1">
                Commercial shrimp trawling has designated season periods to protect juveniles.
                Recreational anglers catching shrimp by hand-line are generally not affected.
              </p>
            </div>
            <div>
              <p className="text-white font-medium">Marine Protected Area Closures</p>
              <p className="text-gray-400 text-sm mt-1">
                Certain MPA zones may have temporary fishing closures. Check with local authorities
                before fishing near Sir Bani Yas, Marawah, or Bu Tinnah islands.
              </p>
            </div>
          </div>
        </section>

        {/* Protected Species */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Fully Protected Species</h2>
          </div>
          <p className="text-gray-400 mb-5">
            The following species are fully protected in UAE waters. It is illegal to catch, harm, possess,
            sell, or trade these species. If caught accidentally, release immediately.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: 'Whale Shark', latin: 'Rhincodon typus', reason: 'CITES Appendix II — world\'s largest fish. Fully protected globally.' },
              { name: 'Dugong', latin: 'Dugong dugon', reason: 'UAE has one of the world\'s largest Dugong populations. Fully protected.' },
              { name: 'All Sea Turtles', latin: '5 species present', reason: 'Green, Hawksbill, Loggerhead, Leatherback and Olive Ridley all protected.' },
              { name: 'Napoleon Wrasse (Humphead)', latin: 'Cheilinus undulatus', reason: 'Endangered. CITES Appendix II. Vital reef ecosystem role.' },
              { name: 'Giant Manta Ray', latin: 'Mobula birostris', reason: 'Endangered. Protected throughout UAE waters.' },
              { name: 'Whale Shark', latin: 'Rhincodon typus', reason: 'Critically important to UAE tourism and reef ecosystems.' },
              { name: 'Hammerhead Sharks', latin: 'Sphyrna spp.', reason: 'Critically Endangered globally. No-take in UAE.' },
              { name: 'Sawfish', latin: 'Pristis spp.', reason: 'Critically Endangered. Listed under UAE federal law.' },
            ].filter((v, i, a) => a.findIndex(t => t.name === v.name) === i).map(({ name, latin, reason }) => (
              <div key={name} className="flex items-start gap-3 p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
                <ShieldCheck className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium text-sm">{name}</p>
                  <p className="text-gray-500 text-xs italic mb-1">{latin}</p>
                  <p className="text-gray-400 text-xs">{reason}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Marine Protected Areas */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-teal-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Marine Protected Areas (MPAs)</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                name: 'Marawah Biosphere Reserve',
                emirate: 'Abu Dhabi',
                desc: 'UNESCO Biosphere Reserve. Critical habitat for Dugong, sea turtles, and seagrass beds. Fishing restricted in core zones.',
              },
              {
                name: 'Sir Bani Yas Island',
                emirate: 'Abu Dhabi',
                desc: 'Marine reserve surrounding the island. Rich coral and mangrove ecosystems. Fishing prohibited in protected zones.',
              },
              {
                name: 'Bu Tinnah Shoals',
                emirate: 'Abu Dhabi',
                desc: 'Remote coral shoals with exceptional biodiversity. One of the healthiest reef systems in the southern Arabian Gulf.',
              },
              {
                name: 'Khor Kalba Mangrove Reserve',
                emirate: 'Sharjah',
                desc: 'Oldest mangroves in Arabia. Important nursery habitat for many fish species. Fishing restricted.',
              },
              {
                name: 'Dibba Marine Reserve',
                emirate: 'Fujairah',
                desc: 'Located on the Gulf of Oman side. Rich Omani Sea marine life including whale sharks, turtles and coral.',
              },
              {
                name: 'Al Zorah Nature Reserve',
                emirate: 'Ajman',
                desc: 'Protected mangrove and lagoon ecosystem near Ajman. Flamingo habitat. No fishing in core zones.',
              },
            ].map(({ name, emirate, desc }) => (
              <div key={name} className="p-5 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-400" />
                  <span className="text-xs text-teal-400">{emirate}</span>
                </div>
                <h3 className="font-semibold text-white text-sm mb-2">{name}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Responsible Fishing Tips */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Responsible Fishing Best Practices</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                title: 'Catch & Release Technique',
                tips: ['Keep fish in the water as much as possible', 'Use wet hands or a wet cloth to handle fish', 'Remove hooks quickly with pliers', 'Support the fish upright until it swims away strongly'],
              },
              {
                title: 'Hook Selection',
                tips: ['Use circle hooks — they reduce deep hooking', 'Consider barbless hooks for easier, safer release', 'Avoid treble hooks when targeting species you plan to release', 'Match hook size to target species to reduce bycatch'],
              },
              {
                title: 'Fight Time Matters',
                tips: ['Land fish quickly to reduce exhaustion stress', 'Use appropriately rated tackle for your target', 'A prolonged fight exhausts fish and increases post-release mortality', 'Keep the fish moving forward after release to ventilate gills'],
              },
              {
                title: 'Leave No Trace',
                tips: ['Pack out all fishing line and tackle', 'Monofilament takes 600 years to degrade', 'Discard old bait responsibly away from water', 'Never release non-native bait species into UAE waters'],
              },
            ].map(({ title, tips }) => (
              <div key={title} className="p-5 rounded-xl bg-white/5 border border-white/10">
                <h3 className="font-semibold text-white mb-3">{title}</h3>
                <ul className="space-y-1.5">
                  {tips.map((tip) => (
                    <li key={tip} className="flex items-start gap-2 text-sm text-gray-400">
                      <span className="text-teal-400 mt-0.5">·</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* MOCCAE Contact */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Phone className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Contact & Report</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="font-semibold text-white mb-3">MOCCAE — Ministry of Climate Change and Environment</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <p><span className="text-gray-300">Hotline:</span> 800-MOCCAE (800-662223)</p>
                <p><span className="text-gray-300">Email:</span> info@moccae.gov.ae</p>
                <p><span className="text-gray-300">Website:</span> moccae.gov.ae</p>
                <p><span className="text-gray-300">Hours:</span> Sunday–Thursday, 7:30am–3:30pm</p>
              </div>
              <a
                href="https://www.moccae.gov.ae"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-4 text-teal-400 hover:text-teal-300 text-sm font-medium transition-colors"
              >
                Visit MOCCAE website <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20">
              <AlertTriangle className="w-6 h-6 text-red-400 mb-3" />
              <h3 className="font-semibold text-white mb-2">Report Illegal Fishing</h3>
              <p className="text-gray-400 text-sm mb-4">
                Witnessed dynamite fishing, poaching, or illegal nets? Report it immediately.
                Your tip protects UAE fisheries for everyone.
              </p>
              <div className="space-y-1 text-sm">
                <p className="text-white font-medium">MOCCAE Hotline: 800-662223</p>
                <p className="text-gray-400">24/7 emergency environmental reporting</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-8 border-t border-white/10">
          <h2 className="text-2xl font-bold text-white mb-3">Fish Smarter. Fish Sustainably.</h2>
          <p className="text-gray-400 mb-6">
            Join the UAE Anglers Hub community and contribute your catch data to marine conservation.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/species"
              className="inline-flex items-center gap-2 border border-white/30 hover:border-white text-white px-6 py-3 rounded-lg font-semibold transition-colors text-sm"
            >
              <Fish className="w-4 h-4" />
              View Species Guide
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors text-sm"
            >
              Join the Community
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
