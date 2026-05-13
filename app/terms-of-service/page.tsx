import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for UAE Anglers Hub and Ocean Sentinel.',
};

export default function TermsOfServicePage() {
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
            Terms of Service
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
            Please read these Terms of Service ("Terms") carefully before using the UAE Anglers Hub website and Ocean Sentinel mobile application (collectively, the "Services") operated by <strong className="text-white">Black Pearl FZE LLC</strong> ("we", "our", or "us").
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-300 leading-relaxed">By accessing or using our Services, you agree to be bound by these Terms. If you do not agree to any part of these Terms, you must not use our Services.</p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">2. Eligibility</h2>
          <p className="text-gray-300 leading-relaxed">You must be at least 13 years old to use our Services. By using our Services, you represent and warrant that you meet this requirement and have the legal capacity to enter into these Terms.</p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">3. Account Registration</h2>
          <ul className="space-y-2 text-gray-300 list-disc pl-5">
            <li>You must provide accurate and complete information when creating an account.</li>
            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
            <li>You are responsible for all activities that occur under your account.</li>
            <li>You must notify us immediately of any unauthorised use of your account.</li>
          </ul>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">4. User-Generated Content</h2>
          <h3 className="text-lg font-semibold text-white mt-6 mb-2">4.1 Ownership</h3>
          <p className="text-gray-300 leading-relaxed">You retain ownership of any content you submit, post, or display on our Services ("User Content"). By submitting User Content, you grant us a worldwide, non-exclusive, royalty-free licence to use, reproduce, modify, and display such content for the purpose of operating and improving our Services.</p>

          <h3 className="text-lg font-semibold text-white mt-6 mb-2">4.2 Prohibited Content</h3>
          <p className="text-gray-300 leading-relaxed">You may not submit content that:</p>
          <ul className="space-y-2 text-gray-300 list-disc pl-5">
            <li>Is unlawful, harmful, threatening, abusive, or defamatory.</li>
            <li>Infringes intellectual property rights or privacy rights.</li>
            <li>Contains malware, viruses, or other harmful code.</li>
            <li>Promotes illegal fishing, poaching, or harm to protected species.</li>
            <li>Is false, misleading, or fraudulent.</li>
          </ul>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">5. Acceptable Use</h2>
          <p className="text-gray-300 leading-relaxed">You agree not to:</p>
          <ul className="space-y-2 text-gray-300 list-disc pl-5">
            <li>Use our Services for any illegal or unauthorised purpose.</li>
            <li>Attempt to gain unauthorised access to our systems or other users&apos; accounts.</li>
            <li>Interfere with or disrupt the integrity or performance of our Services.</li>
            <li>Scrape, crawl, or otherwise extract data from our Services without permission.</li>
            <li>Use our AI identification features to harm marine life or circumvent conservation regulations.</li>
          </ul>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">6. Intellectual Property</h2>
          <p className="text-gray-300 leading-relaxed">All content, features, and functionality of our Services — including text, graphics, logos, and software — are owned by Black Pearl FZE LLC and protected by UAE and international intellectual property laws. You may not copy, modify, or distribute our content without prior written consent.</p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">7. Marine Conservation and Legal Compliance</h2>
          <ul className="space-y-2 text-gray-300 list-disc pl-5">
            <li>Our Services are designed to support responsible angling and marine conservation.</li>
            <li>Catch data shared publicly may be used for marine biodiversity research.</li>
            <li>You are responsible for complying with all applicable UAE fishing regulations, including licensing requirements, protected species rules, and closed seasons.</li>
            <li>We do not condone illegal fishing activities and reserve the right to report suspected violations to authorities.</li>
          </ul>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">8. AI and Identification Accuracy</h2>
          <p className="text-gray-300 leading-relaxed">Our AI-powered species identification is provided for informational purposes only. We do not guarantee 100% accuracy. You are responsible for verifying species identification and ensuring compliance with relevant regulations.</p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">9. Limitation of Liability</h2>
          <p className="text-gray-300 leading-relaxed">To the maximum extent permitted by UAE law, Black Pearl FZE LLC shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our Services. Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim, or AED 100 if no payment was made.</p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">10. Disclaimer of Warranties</h2>
          <p className="text-gray-300 leading-relaxed">Our Services are provided "as is" and "as available" without warranties of any kind, either express or implied. We do not warrant that our Services will be uninterrupted, secure, or error-free.</p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">11. Termination</h2>
          <p className="text-gray-300 leading-relaxed">We may suspend or terminate your account and access to our Services at any time, with or without notice, for conduct that we believe violates these Terms or is harmful to other users or us. You may delete your account at any time.</p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">12. Governing Law</h2>
          <p className="text-gray-300 leading-relaxed">These Terms shall be governed by and construed in accordance with the laws of the United Arab Emirates. Any disputes shall be subject to the exclusive jurisdiction of the courts of Ajman, UAE.</p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">13. Changes to Terms</h2>
          <p className="text-gray-300 leading-relaxed">We may modify these Terms at any time. We will notify you of material changes via email or in-app notification. Your continued use of our Services after changes constitutes acceptance of the revised Terms.</p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">14. Contact Us</h2>
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
