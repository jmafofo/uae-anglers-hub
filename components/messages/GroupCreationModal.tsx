'use client';

import { useState } from 'react';
import { X, Users, Loader2, AlertCircle } from 'lucide-react';
import MemberSearchInput, { type SearchedUser } from './MemberSearchInput';
import { getAuthHeaders } from '@/lib/supabase';

interface GroupCreationModalProps {
  onClose: () => void;
  onCreated: (conversationId: string) => void;
  userId: string;
}

export default function GroupCreationModal({ onClose, onCreated, userId }: GroupCreationModalProps) {
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<SearchedUser[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const name = groupName.trim();
    if (!name) { setError('Enter a group name.'); return; }
    if (selectedMembers.length === 0) { setError('Add at least one member.'); return; }

    setCreating(true);
    const res = await fetch('/api/conversations/group', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
      body: JSON.stringify({
        name,
        member_ids: selectedMembers.map((m) => m.id),
      }),
    });
    const body = await res.json().catch(() => ({}));
    setCreating(false);

    if (!res.ok) {
      setError(body.error || 'Could not create group.');
      return;
    }

    if (body.conversation_id) {
      onCreated(body.conversation_id);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="group-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[#0a0f1a] border border-white/10 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="group-modal-title" className="text-white font-bold text-base">Start a group</h2>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
            </div>
          )}

          <div>
            <label htmlFor="group-name" className="block text-xs font-medium text-gray-400 mb-1">Group name</label>
            <input
              id="group-name"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value.slice(0, 80))}
              placeholder="e.g. Friday Al Aryam Trip"
              maxLength={80}
              className="w-full bg-white/5 border border-white/10 focus:border-teal-500 rounded-lg px-3 py-2 text-white placeholder-gray-600 outline-none text-sm"
            />
          </div>

          <MemberSearchInput
            selected={selectedMembers}
            onChange={setSelectedMembers}
            excludeIds={[userId]}
            placeholder="Search anglers by name…"
          />

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:bg-indigo-700 text-white text-sm font-semibold transition-colors"
            >
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
              Create group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
