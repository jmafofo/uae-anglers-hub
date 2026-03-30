import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: "UAE Anglers Hub — UAE's Premier Shore Fishing Community",
    template: '%s | UAE Anglers Hub',
  },
  description:
    "Discover 50+ verified fishing spots across all 7 Emirates. Log catches, join tournaments, connect with UAE anglers, and get AI-powered fishing forecasts at uaeangler.com.",
  keywords: [
    'fishing UAE',
    'UAE fishing spots',
    'shore fishing Dubai',
    'Abu Dhabi fishing',
    'fishing community UAE',
    'UAE angler',
    'fishing locations UAE',
    'Dubai fishing spots',
    'RAK fishing',
    'Fujairah fishing',
  ],
  authors: [{ name: 'UAE Anglers Hub' }],
  creator: 'UAE Anglers Hub',
  openGraph: {
    type: 'website',
    locale: 'en_AE',
    url: 'https://uaeangler.com',
    siteName: 'UAE Anglers Hub',
    title: "UAE Anglers Hub — Catch More. Explore Smarter. Connect Deeper.",
    description:
      "The UAE's premier fishing community. 50+ verified spots, AI fishing assistant, catch logs, tournaments and more.",
    images: [
      {
        url: 'https://uaeangler.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'UAE Anglers Hub',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UAE Anglers Hub',
    description: "UAE's premier shore fishing community platform.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  metadataBase: new URL('https://uaeangler.com'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0a0f1a] text-white antialiased`}>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
