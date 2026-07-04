import type { Metadata } from 'next';
import Link from 'next/link';
import ContactForm from './ContactForm';

export const metadata: Metadata = {
  title: 'Contact UAE Anglers Hub',
  description:
    'Get in touch with UAE Anglers Hub for general enquiries, press, partnerships, and support.',
  alternates: {
    canonical: 'https://uaeangler.com/contact',
  },
};

export default function ContactPage() {
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
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-6 mb-2">Contact Us</h1>
          <p className="text-gray-400">We would love to hear from you</p>
        </div>

        <div className="prose prose-invert prose-gray max-w-none">
          <p className="text-gray-300 leading-relaxed">
            Have a question, suggestion, or opportunity? The UAE Anglers Hub team is here to help.
            Whether you need support with your account, want to share a fishing report, are
            interested in partnering with us, or represent the media, we read every message and aim
            to respond as quickly as possible.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">How to reach us</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
            <div>
              <p className="text-white font-semibold">General enquiries & support</p>
              <p className="text-gray-300 text-sm">
                For questions about your account, the website, the Ocean Sentinel app, or anything
                else:{' '}
                <a
                  href="mailto:info@uaeangler.com"
                  className="text-teal-400 hover:text-teal-300 transition-colors"
                >
                  info@uaeangler.com
                </a>
              </p>
            </div>
            <div>
              <p className="text-white font-semibold">Press and media</p>
              <p className="text-gray-300 text-sm">
                For interview requests, press kits, facts about the platform, or media partnerships:{' '}
                <a
                  href="mailto:press@uaeangler.com"
                  className="text-teal-400 hover:text-teal-300 transition-colors"
                >
                  press@uaeangler.com
                </a>
              </p>
            </div>
            <div>
              <p className="text-white font-semibold">Partnerships, advertising, and sponsorships</p>
              <p className="text-gray-300 text-sm">
                For charter listings, tournament sponsorships, advertising placements, and business
                collaborations:{' '}
                <a
                  href="mailto:partnerships@uaeangler.com"
                  className="text-teal-400 hover:text-teal-300 transition-colors"
                >
                  partnerships@uaeangler.com
                </a>
              </p>
            </div>
            <div>
              <p className="text-white font-semibold">Postal address</p>
              <p className="text-gray-300 text-sm">
                Black Pearl FZE LLC
                <br />
                BC-890129, 26th Floor, Amber Gem Tower
                <br />
                Sheikh Khalifa Street, Ajman, United Arab Emirates
              </p>
            </div>
          </div>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">Response times</h2>
          <ul className="space-y-2 text-gray-300 list-disc pl-5">
            <li>General support: within 2 business days.</li>
            <li>Press and media requests: within 1 business day.</li>
            <li>Partnership and advertising enquiries: within 2 business days.</li>
          </ul>
          <p className="text-gray-300 leading-relaxed mt-4">
            Our team is based in the UAE and works Sunday through Thursday. Messages sent over the
            weekend or during public holidays are answered on the next business day.
          </p>
          <p className="text-gray-300 leading-relaxed mt-4">
            For community questions, fishing tips, and trip reports, you can also join the
            conversation in our public forum. It is often the fastest way to get advice from fellow
            anglers across the Emirates.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">Send us a message</h2>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
