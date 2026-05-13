import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for UAE Anglers Hub and Ocean Sentinel.',
};

export default function PrivacyPolicyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-gray-400">UAE Anglers Hub &middot; Ocean Sentinel</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 mb-10">
          <p className="text-gray-300 text-sm">
            <strong className="text-white">Effective Date:</strong> 2 May 2026
          </p>
          <p className="text-gray-300 text-sm mt-1">
            <strong className="text-white">Last Updated:</strong> 2 May 2026
          </p>
        </div>

        <div className="prose prose-invert prose-gray max-w-none">
          <p className="text-gray-300 leading-relaxed">
            <strong className="text-white">Black Pearl FZE LLC</strong> ("we", "our", or "us") operates the UAE Anglers Hub website and Ocean Sentinel mobile application. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our services.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">1. Information We Collect</h2>

          <h3 className="text-lg font-semibold text-white mt-6 mb-2">1.1 Personal Information</h3>
          <ul className="space-y-2 text-gray-300 list-disc pl-5">
            <li><strong className="text-white">Account Information:</strong> Name, email address, phone number, and password when you register.</li>
            <li><strong className="text-white">Authentication:</strong> Google OAuth profile data (name, email, profile picture) when you sign in with Google.</li>
            <li><strong className="text-white">Payment Information:</strong> Processed by third-party payment processors; we do not store card details.</li>
          </ul>

          <h3 className="text-lg font-semibold text-white mt-6 mb-2">1.2 Usage Data</h3>
          <ul className="space-y-2 text-gray-300 list-disc pl-5">
            <li>Device information, IP address, browser type, operating system.</li>
            <li>App interaction data, feature usage, and crash reports.</li>
          </ul>

          <h3 className="text-lg font-semibold text-white mt-6 mb-2">1.3 Location Data</h3>
          <ul className="space-y-2 text-gray-300 list-disc pl-5">
            <li><strong className="text-white">GPS Coordinates:</strong> Collected when you log a catch or sighting. You may disable location services, but some features will not function.</li>
            <li><strong className="text-white">Approximate Location:</strong> Used for weather data and regional content.</li>
          </ul>

          <h3 className="text-lg font-semibold text-white mt-6 mb-2">1.4 User-Generated Content</h3>
          <ul className="space-y-2 text-gray-300 list-disc pl-5">
            <li>Photos of catches, catch logs, forum posts, tournament entries.</li>
            <li>Content you choose to make public will be visible to other users.</li>
          </ul>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">2. How We Use Your Information</h2>
          <ul className="space-y-2 text-gray-300 list-disc pl-5">
            <li>Provide and maintain our services.</li>
            <li>Authenticate users and secure accounts.</li>
            <li>Generate aggregated marine biodiversity data for research.</li>
            <li>Send service notifications, tournament updates, and marketing (with consent).</li>
            <li>Improve our AI models and app performance.</li>
            <li>Comply with legal obligations and UAE regulations.</li>
          </ul>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">3. Data Sharing and Disclosure</h2>
          <p className="text-gray-300 leading-relaxed">We do not sell your personal information. We may share data with:</p>
          <ul className="space-y-2 text-gray-300 list-disc pl-5">
            <li><strong className="text-white">Service Providers:</strong> Supabase (database/auth), Anthropic (AI identification), cloud hosting.</li>
            <li><strong className="text-white">Research Partners:</strong> Anonymised, aggregated catch data shared with UAE marine research institutions.</li>
            <li><strong className="text-white">Legal Requirements:</strong> When required by UAE law or to protect our rights.</li>
            <li><strong className="text-white">Business Transfers:</strong> In the event of a merger, acquisition, or asset sale.</li>
          </ul>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">4. Data Security</h2>
          <p className="text-gray-300 leading-relaxed">We implement industry-standard security measures including encryption in transit (TLS), encrypted storage, and access controls. However, no method of transmission over the internet is 100% secure.</p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">5. Data Retention</h2>
          <p className="text-gray-300 leading-relaxed">We retain your personal data for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time.</p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">6. Your Rights</h2>
          <p className="text-gray-300 leading-relaxed">Under applicable UAE data protection laws, you have the right to:</p>
          <ul className="space-y-2 text-gray-300 list-disc pl-5">
            <li>Access, correct, or delete your personal data.</li>
            <li>Withdraw consent for marketing communications.</li>
            <li>Export your data.</li>
            <li>Lodge a complaint with the relevant UAE data protection authority.</li>
          </ul>
          <p className="text-gray-300 leading-relaxed mt-4">To exercise these rights, contact us at <a href="mailto:info@uaeangler.com" className="text-teal-400 hover:text-teal-300">info@uaeangler.com</a>.</p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">7. Children&apos;s Privacy</h2>
          <p className="text-gray-300 leading-relaxed">Our services are not intended for children under 13. We do not knowingly collect data from children under 13. If you believe we have collected such data, please contact us immediately.</p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">8. Third-Party Links</h2>
          <p className="text-gray-300 leading-relaxed">Our services may contain links to third-party websites. We are not responsible for the privacy practices of those sites.</p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">9. Changes to This Policy</h2>
          <p className="text-gray-300 leading-relaxed">We may update this Privacy Policy periodically. We will notify you of significant changes via email or in-app notification.</p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">10. Contact Us</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="text-gray-300 leading-relaxed">
              <strong className="text-white">Black Pearl FZE LLC</strong><br />
              BC-890129, 26th Floor, Amber Gem Tower<br />
              Sheikh Khalifa Street, Ajman, United Arab Emirates<br />
              Email: <a href="mailto:info@uaeangler.com" className="text-teal-400 hover:text-teal-300">info@uaeangler.com</a><br />
              Phone: +971 52 554 3544
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
