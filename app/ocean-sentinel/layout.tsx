import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ocean Sentinel — AI Fish Identification App for UAE Waters',
  description:
    'Ocean Sentinel identifies 40+ UAE fish species from a photo using TensorFlow AI. Works fully offline — perfect for boat trips. Scientific names, habitat, conservation status for every species.',
};

export default function OceanSentinelLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
