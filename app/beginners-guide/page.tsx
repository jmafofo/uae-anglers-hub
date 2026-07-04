import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Beginner's Guide to Fishing in the UAE | UAE Anglers Hub",
  description:
    'New to fishing in the UAE? Learn how to get a fishing licence, understand key regulations, pick the right tackle, find beginner-friendly spots, and fish safely and ethically.',
  alternates: {
    canonical: 'https://uaeangler.com/beginners-guide',
  },
};

const beginnerSpots = [
  { name: 'Al Mamzah Beach', slug: 'al-mamzah-beach' },
  { name: 'Jumeirah Beach', slug: 'jumeirah-beach' },
  { name: 'Mina Al Arab Lagoon', slug: 'mina-al-arab-lagoon' },
  { name: 'Al Zorah Nature Reserve', slug: 'al-zorah-nature-reserve' },
  { name: 'Sharjah Corniche', slug: 'sharjah-corniche' },
  { name: 'Al Khan Lagoon', slug: 'al-khan-lagoon' },
];

export default function BeginnersGuidePage() {
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
            Beginner&apos;s Guide to Fishing in the UAE
          </h1>
          <p className="text-gray-400">
            Everything you need to start fishing responsibly across the Emirates
          </p>
        </div>

        <div className="prose prose-invert prose-gray max-w-none">
          <p className="text-gray-300 leading-relaxed">
            Fishing in the UAE offers an incredible range of experiences, from calm Persian Gulf
            beaches and family-friendly lagoons to the deep-blue waters of the Gulf of Oman. Whether
            you are a resident looking for a weekend hobby or a visitor curious about local angling,
            this guide covers the essentials: licences, seasons, tackle, beginner-friendly spots,
            safety, and ethics. From the city beaches of Dubai to the remote shores of Abu Dhabi and
            the fjord-like coastline of Fujairah, there is a style of fishing to match every
            schedule and budget.{' '}
            <strong className="text-white">UAE Anglers Hub</strong> is here to help you start
            responsibly and make every trip more productive.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">Licences & regulations</h2>
          <p className="text-gray-300 leading-relaxed">
            Before you cast your first line, you need a valid UAE recreational fishing licence.
            Federal law requires one for anyone fishing in UAE waters, and enforcement checks are
            common at popular shore and boat access points. UAE nationals usually receive licences
            free of charge, while expatriate residents pay a small annual fee. You can apply through
            the{' '}
            <a
              href="https://moccae.gov.ae/en/services/fishing-license.aspx"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-400 hover:text-teal-300 transition-colors"
            >
              MOCCAE fishing licence service
            </a>{' '}
            or the EREG government portal, and licences are also available via MOCCAE service
            centres. Keep a digital or printed copy with you whenever you fish.
          </p>
          <p className="text-gray-300 leading-relaxed mt-4">
            Knowing the rules protects fish stocks and keeps you on the right side of the law. Key
            regulations to remember:
          </p>
          <ul className="space-y-2 text-gray-300 list-disc pl-5 mt-4">
            <li>
              <strong className="text-white">Hammour ban:</strong> Hammour (orange-spotted grouper)
              and related grouper species are protected from 1 July to 31 August during their
              spawning season. The minimum keep size for Hammour is 40 cm total length.
            </li>
            <li>
              <strong className="text-white">Shari ban:</strong> Spangled emperor (Shari) has a
              spawning-season closure from 1 February to 31 March and a minimum size of 25 cm.
            </li>
            <li>
              <strong className="text-white">Zubaidi ban:</strong> Silver pomfret (Zubaidi) is
              banned from 1 May to 30 June, with a minimum size of 20 cm.
            </li>
            <li>
              <strong className="text-white">Protected species:</strong> Sharks, rays, sea turtles,
              dugongs, whale sharks, dolphins, whales and seahorses are fully protected. If you
              accidentally hook one, cut the line or release it immediately without removing it from
              the water.
            </li>
            <li>
              <strong className="text-white">Size limits:</strong> Kingfish must be at least 55 cm,
              Hamra (red snapper family) 25 cm, Sultan Ibrahim 15 cm, and Farsh (rabbitfish) 15 cm
              total length. Measure carefully and release anything undersized.
            </li>
            <li>
              <strong className="text-white">Banned methods:</strong> Explosives, poisons,
              electrical stunning devices and bottom trawling within 6 nautical miles are illegal.
              Damaging coral or seagrass is also prohibited.
            </li>
          </ul>
          <p className="text-gray-300 leading-relaxed mt-4">
            Regulations can change from year to year, so always check our{' '}
            <Link href="/regulations" className="text-teal-400 hover:text-teal-300 transition-colors">
              UAE fishing regulations page
            </Link>{' '}
            or verify directly with MOCCAE before you head out.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">Seasons</h2>
          <p className="text-gray-300 leading-relaxed">
            The UAE fishing year roughly splits into a cooler high season from October to April and
            a hot summer from May to September. During winter, water temperatures drop and pelagic
            species such as kingfish, queenfish, tuna and sailfish move closer to shore, especially
            along the east coast and northern emirates. Spring and autumn are transition windows
            when many species feed aggressively before spawning or before the summer heat arrives.
          </p>
          <p className="text-gray-300 leading-relaxed mt-4">
            Summer fishing is tougher but not impossible. Fish retreat to deeper, cooler water
            during the middle of the day, so the most productive sessions are early mornings before
            sunrise and late evenings after sunset. Night fishing from beaches and breakwaters can
            also be rewarding, particularly for species that hunt around lights and shadows.
          </p>
          <p className="text-gray-300 leading-relaxed mt-4">
            The Persian Gulf coast, covering Abu Dhabi, Dubai, Sharjah, Ajman, Umm Al Quwain and Ras
            Al Khaimah, tends to have calmer, shallower water and excellent shore access. The Gulf
            of Oman coast around Fujairah and Dibba offers deeper water close to shore, stronger
            currents, and a different mix of species including amberjack, dorado and striped marlin.
            Many anglers plan winter trips to Fujairah and spring or autumn sessions on the west
            coast. Tides often matter more than the exact season: a moving tide concentrates bait and
            predator fish, while slack water can shut the bite down. Check local tide charts and aim
            to fish the first two hours of the incoming or outgoing tide whenever possible. Browse
            our{' '}
            <Link href="/species" className="text-teal-400 hover:text-teal-300 transition-colors">
              species guide
            </Link>{' '}
            to learn when each fish is most active.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">Basic tackle</h2>
          <p className="text-gray-300 leading-relaxed">
            You do not need a boat or expensive equipment to start catching fish in the UAE. A
            simple, versatile setup will handle most situations.
          </p>
          <ul className="space-y-2 text-gray-300 list-disc pl-5 mt-4">
            <li>
              <strong className="text-white">Shore fishing:</strong> A 7–9 ft medium-heavy spinning
              rod paired with a 4000–5000 size reel is ideal for beaches, breakwaters and jetties.
              Spool 20–30 lb braided main line for casting distance and sensitivity, and add a
              30–50 lb fluorocarbon or monofilament leader to resist rocks and reef abrasion.
            </li>
            <li>
              <strong className="text-white">Boat or kayak fishing:</strong> A shorter 6–7 ft rod
              is easier to manage in tight spaces. Match it with a 5000–6000 size reel and a heavier
              leader if you are fishing reefs or wrecks.
            </li>
            <li>
              <strong className="text-white">Hooks:</strong> Carry circle hooks in sizes 2/0 to 4/0
              for general bait fishing. They usually hook fish in the corner of the mouth, which
              makes release much easier. Add a few jig heads and small soft plastics for flats and
              lagoons.
            </li>
            <li>
              <strong className="text-white">Lures vs bait:</strong> Fresh or live bait such as
              sardines, squid and shrimp is reliable for beginners because scent attracts fish even
              when your presentation is imperfect. Once you can read the water and current, add
              metal jigs, poppers and soft plastics to cover more ground and target pelagic
              predators.
            </li>
          </ul>
          <p className="text-gray-300 leading-relaxed mt-4">
            Start simple and upgrade as you learn which species you target most. The best tackle is
            the one you know how to use.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">Top beginner spots</h2>
          <p className="text-gray-300 leading-relaxed">
            The UAE has dozens of accessible fishing locations. These six are easy to reach, offer
            reasonable facilities, and give new anglers a good chance of action:
          </p>
          <ul className="space-y-3 text-gray-300 list-disc pl-5 mt-4">
            {beginnerSpots.map((spot) => (
              <li key={spot.slug}>
                <Link
                  href={`/spots/${spot.slug}`}
                  className="text-teal-400 hover:text-teal-300 font-medium transition-colors"
                >
                  {spot.name}
                </Link>
                {' — '}
                {spot.slug === 'al-mamzah-beach' &&
                  'calm, sheltered water on the Dubai–Sharjah border; good for kingfish, queenfish, trevally and bream, with beach-park facilities that make it family friendly.'}
                {spot.slug === 'jumeirah-beach' &&
                  'a public beach with good facilities, wading and kayak access; target kingfish, queenfish, barracuda and Hammour outside the closed season.'}
                {spot.slug === 'mina-al-arab-lagoon' &&
                  'a shallow, safe lagoon in Ras Al Khaimah with mangroves; beginner friendly and home to rabbitfish, small barracuda and emperor fish.'}
                {spot.slug === 'al-zorah-nature-reserve' &&
                  'scenic mangrove flats in Ajman with kayak rentals; holds mullet, trevally, barracuda, grouper and sea bass. Stick to the permitted public areas.'}
                {spot.slug === 'sharjah-corniche' &&
                  'easy evening access along the corniche walkway; mixed coastal species and a relaxed atmosphere for short sessions.'}
                {spot.slug === 'al-khan-lagoon' &&
                  'a very accessible public lagoon in Sharjah; target kingfish, queenfish, trevally and cobia, especially on a moving tide.'}
              </li>
            ))}
          </ul>
          <p className="text-gray-300 leading-relaxed mt-4">
            You can explore photos, GPS coordinates, species lists and access tips for every location
            on our{' '}
            <Link href="/spots" className="text-teal-400 hover:text-teal-300 transition-colors">
              fishing spots page
            </Link>
            .
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">Safety & ethics</h2>
          <p className="text-gray-300 leading-relaxed">
            The UAE sun is intense, even in winter. Wear UV-protective clothing, a wide-brimmed hat,
            polarised sunglasses and reef-safe sunscreen. Bring more water than you think you need, a
            basic first-aid kit, and a fully charged phone. Let someone know where you are fishing
            and when you expect to return, especially if you are heading to a remote beach at night.
          </p>
          <p className="text-gray-300 leading-relaxed mt-4">
            Ethics matter as much as catching fish. Respect daily catch limits, keep only what you
            will eat, and release undersized or protected fish quickly with minimal handling. Never
            fish in marine protected areas unless signage clearly allows it, avoid anchoring on
            seagrass or coral, and always take your litter home.
          </p>
          <p className="text-gray-300 leading-relaxed mt-4">
            Learn to read the environment before you cast. Watch for birds diving, baitfish flickering
            on the surface, or colour changes in the water; these are signs that predators are nearby.
            A quiet approach and minimal noise on the rocks or deck will keep fish from spooking in
            shallow water. A clean spot is a productive spot, and responsible anglers help keep UAE
            fisheries healthy for future generations.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">Next steps</h2>
          <p className="text-gray-300 leading-relaxed">
            Now that you know the basics, the best way to improve is to get out on the water. Browse
            our{' '}
            <Link href="/species" className="text-teal-400 hover:text-teal-300 transition-colors">
              species guide
            </Link>{' '}
            to identify your catch, check the latest{' '}
            <Link
              href="/regulations"
              className="text-teal-400 hover:text-teal-300 transition-colors"
            >
              fishing regulations
            </Link>{' '}
            before every trip, discover more verified{' '}
            <Link href="/spots" className="text-teal-400 hover:text-teal-300 transition-colors">
              fishing spots
            </Link>
            , and{' '}
            <Link href="/log-catch" className="text-teal-400 hover:text-teal-300 transition-colors">
              log your first catch
            </Link>{' '}
            to contribute to UAE marine citizen science. Tight lines and safe fishing.
          </p>
        </div>
      </div>
    </div>
  );
}
