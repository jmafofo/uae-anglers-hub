import type { Metadata } from 'next';
import SpotsMapClient from './SpotsMapClient';

export const metadata: Metadata = {
  title: 'Fishing Spots Map — UAE Anglers',
  description:
    'Every verified shore, boat, and deep-sea fishing spot in the UAE on one interactive map. Filter by emirate, access type, and target species.',
};

export default function SpotsMapPage() {
  return <SpotsMapClient />;
}
