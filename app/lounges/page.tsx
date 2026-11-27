import type { Metadata } from 'next';
import LoungesClient from './LoungesClient';

export const metadata: Metadata = {
  title: 'Community Lounges — UAE Anglers',
  description:
    'Live chat with anglers across the UAE — per-emirate lounges, today\u2019s conditions, and catch & brag.',
};

export default function LoungesPage() {
  return <LoungesClient />;
}
