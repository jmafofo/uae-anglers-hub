'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';

interface Props {
  type: 'pro' | 'business' | 'slots' | 'boost';
  qty?: number;
  listingId?: string;
  className?: string;
  children: React.ReactNode;
  loadingText?: string;
}

export default function StripeCTA({
  type, qty = 1, listingId, className, children, loadingText = 'Redirecting…',
}: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    const { data: { session } } = await getSupabase().auth.getSession();

    if (!session) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ type, qty, listingId }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Stripe checkout error:', data.error);
        setLoading(false);
      }
    } catch (err) {
      console.error('Checkout failed:', err);
      setLoading(false);
    }
  }

  return (
    <button onClick={handleClick} disabled={loading} className={className}>
      {loading ? loadingText : children}
    </button>
  );
}
