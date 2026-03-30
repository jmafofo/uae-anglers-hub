'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Anchor, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({
        type: 'success',
        text: 'Check your email for a confirmation link to activate your account.',
      });
    }
    setLoading(false);
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
