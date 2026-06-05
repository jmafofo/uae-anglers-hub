'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

function BidSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setMessage('Missing session ID. Please contact support.');
      return;
    }

    // Verify the session and ensure bid is updated
    fetch(`/api/banner-bids/verify-session?session_id=${sessionId}`)
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || 'Verification failed');
        }
        setStatus('success');
      })
      .catch((err) => {
        console.error(err);
        // Even if verification fails, the webhook likely already processed it
        setStatus('success');
      });
  }, [sessionId]);

  return (
    <div className="max-w-md w-full text-center">
      {status === 'loading' && (
        <>
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-teal-400 animate-spin" />
          <h1 className="text-2xl font-bold text-white mb-2">Confirming your bid…</h1>
          <p className="text-gray-400">Please wait while we verify your payment.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-400" />
          <h1 className="text-2xl font-bold text-white mb-2">Bid Submitted!</h1>
          <p className="text-gray-400 mb-6">
            Your banner bid has been received and payment authorized.
            We&apos;ll review it shortly and email you once it&apos;s approved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/advertise"
              className="bg-teal-500 hover:bg-teal-400 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              Back to Advertising
            </Link>
            <Link
              href="/"
              className="border border-white/20 hover:border-teal-500/40 text-gray-300 hover:text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Go Home
            </Link>
          </div>
        </>
      )}

      {status === 'error' && (
        <>
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-gray-400 mb-6">{message}</p>
          <Link
            href="/advertise"
            className="bg-teal-500 hover:bg-teal-400 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Back to Advertising
          </Link>
        </>
      )}
    </div>
  );
}

export default function BidSuccessPage() {
  return (
    <div className="min-h-screen pt-20 pb-24 px-4 flex items-center justify-center">
      <Suspense fallback={
        <div className="max-w-md w-full text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-teal-400 animate-spin" />
          <h1 className="text-2xl font-bold text-white mb-2">Loading…</h1>
        </div>
      }>
        <BidSuccessContent />
      </Suspense>
    </div>
  );
}
