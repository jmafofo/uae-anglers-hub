import type { Metadata } from 'next';
import TripGuideClient from './TripGuideClient';

export const metadata: Metadata = {
  title: 'Trip Guide — UAE Anglers',
};

export default async function TripGuidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TripGuideClient eventId={id} />;
}
