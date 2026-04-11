'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Anchor, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

function ResetPasswordForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [exchanging, setExchanging] = useState(true);

  // Exchange the code from the URL for an active session
  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setError('Invalid or expired reset link. Please request a new one.');
      setExchanging(false);
      return;
    }

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setError('Reset link has expired. Please request a new one.');
      }
      setExchanging(false);
    });
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setDone(true);
      setTimeout(() => router.push('/'), 2500);
    }
  }

  if (exchanging) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">Verifying reset link…</div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-teal-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-2">Password updated</h1>
          <p className="text-gray-400 text-sm">Redirecting you to the home page…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-14">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Anchor className="w-6 h-6 text-teal-400" />
            <span className="text-white font-bold text-lg">UAE Anglers Hub</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Set a new password</h1>
          <p className="text-gray-400 text-sm mt-2">Choose something strong and memorable.</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          {error && (
            <div className="mb-6 p-4 rounded-lg text-sm bg-red-500/10 border border-red-500/30 text-red-400">
              {error}
              {error.includes('expired') && (
                <span>
                  {' '}<a href="/forgot-password" className="underline font-medium">Request a new link →</a>
                </span>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New password */}
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">New password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-4 py-3 pr-11 text-white placeholder-gray-500 outline-none transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Confirm password</label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your new password"
                className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors text-sm"
              />
            </div>

            {/* Strength hint */}
            {password.length > 0 && (
              <div className="flex gap-1.5">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      password.length >= [8, 12, 16, 20][i]
                        ? ['bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-teal-400'][i]
                        : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password || !confirm || !!error?.includes('expired')}
              className="w-full bg-teal-500 hover:bg-teal-400 disabled:bg-teal-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors text-sm"
            >
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
