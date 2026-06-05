'use client';

import { useState } from 'react';
import { X, Users, Loader2, AlertCircle } from 'lucide-react';
import MemberSearchInput, { type SearchedUser } from './MemberSearchInput';
import { getAuthHeaders } from '@/lib/supabase';

interface AddMembersModalProps {
  conversationId: string;
  existingMemberIds: string[];
  onClose: () => void;
  onAdded: () => void;
}

export default function AddMembersModal({
  conversationId,
  existingMemberIds,
  onClose,
  onAdded,
}: AddMembersModalProps) {
  const [selected, setSelected] = useState<SearchedUser[]>([]);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.length === 0) return;
    setError(null);
    setAdding(true);

    const headers = { 'Content-Type': 'application/json', ...(await getAuthHeaders()) };
    const res = await fetch(`/api/conversations/${conversationId}/members`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ member_ids: selected.map((u) => u.id) }),
    });

    const body = await res.json().catch(() => ({}));
    setAdding(false);

    if (!res.ok) {
      setError(body.error || 'Could not add members');
      return;
    }

    onAdded();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[#0a0f1a] border border-white/10 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-base">Add members</h2>
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

          <MemberSearchInput
            selected={selected}
            onChange={setSelected}
            excludeIds={existingMemberIds}
            placeholder="Search anglers to add…"
            label="Add members"
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
              disabled={adding || selected.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:bg-indigo-700 text-white text-sm font-semibold transition-colors"
            >
              {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
              Add {selected.length > 0 ? `(${selected.length})` : ''}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
