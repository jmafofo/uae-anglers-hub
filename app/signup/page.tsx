'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Anchor, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const token_hash = params.get('token_hash');
    if (code || token_hash) {
      const next = params.get('next') ?? '/';
      const p = new URLSearchParams();
      if (code) p.set('code', code);
      if (token_hash) p.set('token_hash', token_hash);
      p.set('next', next);
      router.replace(`/auth/confirm?${p.toString()}`);
    }
  }, [router]);

  function validatePassword(pw: string): string | null {
    if (pw.length < 8) return 'Password must be at least 8 characters.';
    const hasNumber = /\d/.test(pw);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw);
    if (!hasNumber && !hasSpecial) {
      return 'Password must contain at least one number or special character.';
    }
    return null;
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const pwError = validatePassword(password);
    if (pwError) {
      setMessage({ type: 'error', text: pwError });
      setLoading(false);
      return;
    }

    const ref = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('ref')
      : null;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          ...(ref ? { referred_by_username: ref } : {}),
        },
      },
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
      const domain = email.split('@')[1] ?? 'unknown';
      void fetch('/api/signup-errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error_message: error.message,
          email_domain: domain,
          path: '/signup',
        }),
      }).catch(() => {});
    } else {
      setMessage({
        type: 'success',
        text: 'Check your email for a confirmation link to activate your account.',
      });
    }
    setLoading(false);
  }

  async function signUpWithGoogle() {
    setLoading(true);
    setMessage(null);
    try {
      const redirectTo = `${window.location.origin}/auth/confirm`;
      console.log('[signup] initiating Google OAuth, redirectTo:', redirectTo);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) {
        console.error('[signup] signInWithOAuth error:', error.message);
        setMessage({ type: 'error', text: error.message });
        setLoading(false);
        return;
      }
      console.log('[signup] signInWithOAuth result:', { url: data?.url });
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setMessage({ type: 'error', text: 'Unable to start Google sign-up. Please try again.' });
        setLoading(false);
      }
    } catch (err: any) {
      console.error('[signup] signInWithOAuth exception:', err);
      setMessage({ type: 'error', text: err?.message ?? 'Google sign-up failed. Please try again.' });
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-14">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Anchor className="w-6 h-6 text-teal-400" />
            <span className="text-white font-bold text-lg">UAE Anglers Hub</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Create your account</h1>
          <p className="text-gray-400 text-sm mt-2">
            Free premium for the first 500 members
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-teal-500/10 border border-teal-500/30 text-teal-400'
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Display Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your angler name"
                className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-4 py-3 pr-11 text-white placeholder-gray-500 outline-none transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-500 hover:bg-teal-400 disabled:bg-teal-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors text-sm"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#131c2e] px-3 text-gray-500">or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={signUpWithGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-800 font-semibold py-3 rounded-lg transition-colors text-sm"
          >
            <GoogleIcon className="w-4 h-4" />
            {loading ? 'Redirecting...' : 'Sign up with Google'}
          </button>

          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-teal-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          By signing up you agree to our{' '}
          <Link href="/terms" className="text-gray-400 hover:underline">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-gray-400 hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
