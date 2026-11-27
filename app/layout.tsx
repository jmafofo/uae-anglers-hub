import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AIChatButton from '@/components/AIChatButton';
import PwaRegister from '@/components/PwaRegister';
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION } from '@/lib/seo';

const inter = Inter({ subsets: ['latin'] });

const GOOGLE_ADS_CLIENT = process.env.NEXT_PUBLIC_GOOGLE_ADS_CLIENT;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0f1a',
};

export const metadata: Metadata = {
  title: {
    default: 'UAEAngler — Fishing Spots, Tackle & Charters in the UAE',
    template: '%s | UAEAngler',
  },
  description:
    SITE_DESCRIPTION,
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
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  openGraph: {
    type: 'website',
    locale: 'en_AE',
    siteName: SITE_NAME,
    title: 'UAEAngler — Fishing Spots, Tackle & Charters in the UAE',
    description:
      SITE_DESCRIPTION,
    images: [
      {
        url: 'https://uaeangler.com/api/og',
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
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
  // Individual pages own their canonical: do not canonicalise every page to the homepage.
  metadataBase: new URL(SITE_URL),
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: process.env.BING_SITE_VERIFICATION ? { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } : undefined,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr">
      <head>
        {GOOGLE_ADS_CLIENT && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${GOOGLE_ADS_CLIENT}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className={`${inter.className} bg-[#0a0f1a] text-white antialiased`}>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <Navbar />
        <main id="main-content">{children}</main>
        <Footer />
        <AIChatButton />
        <PwaRegister />
      </body>
    </html>
  );
}
