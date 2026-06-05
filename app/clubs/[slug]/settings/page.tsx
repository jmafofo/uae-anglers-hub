'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, UserPlus, Crown, Shield, UserX, Loader2 } from 'lucide-react';

interface Member {
  id: string; display_name: string; username: string; avatar_url: string | null;
  role: string; joined_at: string;
}

export default function ClubSettingsPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteUsername, setInviteUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  useEffect(() => {
    load();
  }, [slug]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/clubs/${slug}/members`);
      const data = await res.json();
      if (res.ok) {
        setMembers(data.members ?? []);
      } else {
        setError(data.error || 'Failed to load members');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    setInviteLoading(true);

    try {
      const res = await fetch(`/api/clubs/${slug}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: inviteUsername.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteSuccess(`Invited @${inviteUsername.trim()}`);
        setInviteUsername('');
      } else {
        setInviteError(data.error || 'Failed to invite');
      }
    } catch {
      setInviteError('Network error');
    }
    setInviteLoading(false);
  }

  async function handleRemove(userId: string) {
    if (!confirm('Remove this member from the club?')) return;
    try {
      const res = await fetch(`/api/clubs/${slug}/members/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== userId));
      }
    } catch {
      // ignore
    }
  }

  async function handleChangeRole(userId: string, newRole: string) {
    try {
      const res = await fetch(`/api/clubs/${slug}/members/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setMembers((prev) => prev.map((m) => (m.id === userId ? { ...m, role: newRole } : m)));
      }
    } catch {
      // ignore
    }
  }

  if (loading) return <div className="min-h-screen pt-20 flex items-center justify-center text-gray-500">Loading...</div>;
  if (error) return <div className="min-h-screen pt-20 flex items-center justify-center text-red-400">{error}</div>;

  return (
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="max-w-2xl mx-auto">
        <Link href={`/clubs/${slug}`} className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Club
        </Link>

        <h1 className="text-2xl font-extrabold text-white mb-6">Club Settings</h1>

        {/* Invite Members */}
        <div className="p-5 rounded-xl bg-white/5 border border-white/10 mb-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-teal-400" />
            Invite Members
          </h2>
          <form onSubmit={handleInvite} className="flex gap-2">
            <input
              type="text"
              value={inviteUsername}
              onChange={(e) => setInviteUsername(e.target.value)}
              placeholder="Enter username"
              className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 transition-colors text-sm"
            />
            <button
              type="submit"
              disabled={inviteLoading || !inviteUsername.trim()}
              className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 disabled:bg-teal-800 text-white text-sm font-semibold transition-colors"
            >
              {inviteLoading ? '...' : 'Invite'}
            </button>
          </form>
          {inviteError && <p className="text-red-400 text-sm mt-2">{inviteError}</p>}
          {inviteSuccess && <p className="text-teal-400 text-sm mt-2">{inviteSuccess}</p>}
        </div>

        {/* Member List */}
        <div className="p-5 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-400" />
            Members ({members.length})
          </h2>

          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center text-xs text-teal-400 font-bold">
                      {(m.display_name || m.username)?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <Link href={`/profile/${m.username}`} className="text-sm font-medium text-white hover:text-teal-400 transition-colors">
                      {m.display_name || m.username}
                    </Link>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500">@{m.username}</span>
                      {m.role === 'owner' && <Crown className="w-3 h-3 text-yellow-400" />}
                      {m.role === 'admin' && <Shield className="w-3 h-3 text-teal-400" />}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={m.role}
                    onChange={(e) => handleChangeRole(m.id, e.target.value)}
                    className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-gray-300 focus:outline-none"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    <option value="owner">Owner</option>
                  </select>
                  <button
                    onClick={() => handleRemove(m.id)}
                    className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                    title="Remove member"
                  >
                    <UserX className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
