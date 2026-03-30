'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trophy } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { emirates } from '@/lib/spots';

export default function CreateTournamentPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const now = new Date();
  const [form, setForm] = useState({
    title: '', description: '', emirate: '', location_name: '',
    start_date: now.toISOString().slice(0, 16),
    end_date: new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 16),
    scoring_type: 'heaviest', target_species: '', prize_description: '',
    max_participants: '',
  });

  useEffect(() => {
    getSupabase().auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login');
      else setUserId(user.id);
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setPosting(true);
    const { data, error } = await getSupabase().from('tournaments').insert({
      created_by: userId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      emirate: form.emirate || null,
      location_name: form.location_name.trim() || null,
      start_date: new Date(form.start_date).toISOString(),
      end_date: new Date(form.end_date).toISOString(),
      scoring_type: form.scoring_type,
      target_species: form.target_species.trim() || null,
      prize_description: form.prize_description.trim() || null,
      max_participants: form.max_participants ? parseInt(form.max_participants) : null,
      status: new Date(form.start_date) <= new Date() ? 'active' : 'upcoming',
    }).select('id').single();
    if (!error && data) router.push(`/tournaments/${data.id}`);
    setPosting(false);
  }

  const field = 'w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none text-sm';

  return (
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="max-w-2xl mx-auto">
        <Link href="/tournaments" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Tournaments
        </Link>
        <div className="flex items-center gap-2 mb-8">
          <Trophy className="w-5 h-5 text-teal-400" />
          <h1 className="text-2xl font-extrabold text-white">Create Tournament</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Tournament Title *</label>
            <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Dubai Shore Fishing Championship 2026" className={field} />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Rules, eligibility, details..." className={`${field} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Start Date *</label>
              <input type="datetime-local" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className={field} />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">End Date *</label>
              <input type="datetime-local" required value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className={field} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Emirate</label>
              <select value={form.emirate} onChange={(e) => setForm({ ...form, emirate: e.target.value })} className={`${field} bg-[#0a0f1a]`}>
                <option value="">All Emirates</option>
                {emirates.map((em) => <option key={em} value={em}>{em}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Scoring Type</label>
              <select value={form.scoring_type} onChange={(e) => setForm({ ...form, scoring_type: e.target.value })} className={`${field} bg-[#0a0f1a]`}>
                <option value="heaviest">Heaviest Single Catch</option>
                <option value="total_weight">Total Weight</option>
                <option value="most_catches">Most Catches</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Target Species</label>
              <input type="text" value={form.target_species} onChange={(e) => setForm({ ...form, target_species: e.target.value })} placeholder="Any / Kingfish / etc." className={field} />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Max Participants</label>
              <input type="number" min="2" value={form.max_participants} onChange={(e) => setForm({ ...form, max_participants: e.target.value })} placeholder="Unlimited" className={field} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Prize / Award</label>
            <input type="text" value={form.prize_description} onChange={(e) => setForm({ ...form, prize_description: e.target.value })} placeholder="e.g. AED 500 + Trophy" className={field} />
          </div>
          <button type="submit" disabled={posting || !form.title.trim()} className="w-full py-4 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:bg-teal-700 disabled:cursor-not-allowed text-white font-bold transition-colors">
            {posting ? 'Creating...' : 'Create Tournament'}
          </button>
        </form>
      </div>
    </div>
  );
}
