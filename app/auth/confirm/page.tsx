'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const FRIENDLY_ERRORS: Record<string, string> = {
  provider_not_enabled: 'Google sign-in is not available right now. Please use email and password.',
  access_denied: 'Sign-in was cancelled. Please try again.',
  invalid_request: 'Something went wrong with the sign-in link. Please try again.',
  invalid_grant: 'The sign-in link has expired. Please try again.',
  unhandled_error: 'Something went wrong. Please try again.',
};

function friendlyError(raw: string): string {
  const lower = raw.toLowerCase();
  for (const [key, msg] of Object.entries(FRIENDLY_ERRORS)) {
    if (lower.includes(key)) return msg;
  }
  return raw;
}

function logStorage(label: string) {
  if (typeof window === 'undefined') return;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.includes('sb-')) keys.push(k);
  }
  console.log(`[confirm] ${label} localStorage keys:`, keys);
  keys.forEach((k) => {
    const v = localStorage.getItem(k);
    console.log(`[confirm] ${label} ${k}:`, v ? `${v.slice(0, 50)}...` : null);
  });
}

export default function ConfirmPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [message, setMessage] = useState('Confirming your sign-in…');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);

    const token_hash = searchParams.get('token_hash');
    const code = searchParams.get('code');
    const type = searchParams.get('type') ?? 'email';
    const next = searchParams.get('next') ?? '/';
    const errorParam = searchParams.get('error');
    const errorDesc = searchParams.get('error_description');

    console.log('[auth/confirm] params:', {
      token_hash: !!token_hash,
      code: !!code,
      type,
      error: errorParam,
      errorDesc,
      next,
    });

    if (errorParam) {
      const raw = errorDesc ?? errorParam;
      const msg = friendlyError(raw);
      console.error('[auth/confirm] OAuth error from provider:', raw);
      router.replace(`/login?error=${encodeURIComponent(msg)}`);
      return;
    }

    async function confirm() {
      try {
        if (token_hash) {
          console.log('[auth/confirm] verifying OTP…');
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any,
          });
          if (error) throw error;
        } else if (code) {
          console.log('[auth/confirm] exchanging code for session…');
          logStorage('before exchangeCodeForSession');
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          logStorage('after exchangeCodeForSession');
          if (error) throw error;
        } else {
          const hash = window.location.hash;
          if (hash.includes('access_token=')) {
            console.log('[auth/confirm] detected tokens in URL hash, letting Supabase auto-detect…');
            await new Promise((r) => setTimeout(r, 500));
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              throw new Error('Unable to establish session from URL.');
            }
          } else {
            console.log('[auth/confirm] no token or code found');
            router.replace('/login');
            return;
          }
        }

        console.log('[auth/confirm] success, redirecting to:', next);
        const redirectTo = next.startsWith('/') ? next : '/';
        router.replace(redirectTo);
      } catch (err) {
        const msg = err instanceof Error ? friendlyError(err.message) : 'Confirmation failed.';
        console.error('[auth/confirm] confirmation error:', msg, err);
        setStatus('error');
        setMessage(msg);
        setTimeout(() => {
          router.replace(`/login?error=${encodeURIComponent(msg)}`);
        }, 1500);
      }
    }

    confirm();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-14">
      <div className="text-center">
        {status === 'loading' ? (
          <>
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400 text-sm">{message}</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-red-400 text-2xl">!</span>
            </div>
            <p className="text-red-400 text-sm">{message}</p>
            <p className="text-gray-500 text-xs mt-2">Redirecting…</p>
          </>
        )}
      </div>
    </div>
  );
}
