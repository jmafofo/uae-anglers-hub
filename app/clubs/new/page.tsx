'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Anchor, Plus } from 'lucide-react';

export default function CreateClubPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create club');
        setLoading(false);
        return;
      }

      router.push(`/clubs/${data.club.slug}`);
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="max-w-xl mx-auto">
        <Link href="/clubs" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Clubs
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
            <Anchor className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Create a Club</h1>
            <p className="text-gray-400 text-sm">Start a private group for your fishing crew</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Club Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dibba Pelagic Hunters"
              maxLength={80}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 transition-colors"
            />
            <p className="text-xs text-gray-600 mt-1">{name.length}/80</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What kind of fishing does your group do? Where do you usually go?"
              rows={4}
              maxLength={500}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 transition-colors resize-none"
            />
            <p className="text-xs text-gray-600 mt-1">{description.length}/500</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || name.trim().length < 2}
            className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:bg-teal-800 text-white font-bold transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              'Creating...'
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create Club
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
