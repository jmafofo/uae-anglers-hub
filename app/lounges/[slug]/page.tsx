import type { Metadata } from 'next';
import LoungeChatClient from './LoungeChatClient';

export const metadata: Metadata = {
  title: 'Lounge — UAE Anglers',
};

export default async function LoungePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <LoungeChatClient slug={slug} />;
}
