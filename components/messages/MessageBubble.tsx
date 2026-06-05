'use client';

import { useState } from 'react';
import { Check, X, Pencil, Trash2, MoreVertical, Loader2 } from 'lucide-react';
import type { MessageRow, MemberProfile } from './types';

interface MessageBubbleProps {
  message: MessageRow;
  isMine: boolean;
  senderName: string;
  isGroup: boolean;
  onEdit: (id: string, body: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function MessageBubble({
  message,
  isMine,
  senderName,
  isGroup,
  onEdit,
  onDelete,
}: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isFlagged = message.moderation_status === 'flagged' || message.moderation_status === 'removed';
  const showActions = isMine && !message.deleted_at && !isFlagged && !isEditing;

  async function startEdit() {
    setIsEditing(true);
    setEditDraft(message.body);
    setMenuOpen(false);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editDraft.trim()) return;
    setEditSaving(true);
    await onEdit(message.id, editDraft.trim());
    setEditSaving(false);
    setIsEditing(false);
    setEditDraft('');
  }

  async function handleDelete() {
    setMenuOpen(false);
    await onDelete(message.id);
  }

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className="relative group/message max-w-[75%]">
        <div
          className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isMine
              ? 'bg-teal-500 text-white rounded-br-sm'
              : 'bg-white/5 border border-white/10 text-gray-200 rounded-bl-sm'
          }`}
        >
          {isGroup && !isMine && (
            <p className="text-[10px] font-semibold text-teal-300 mb-0.5">{senderName}</p>
          )}

          {isEditing ? (
            <form onSubmit={saveEdit} className="flex items-center gap-2">
              <input
                type="text"
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value.slice(0, 4000))}
                maxLength={4000}
                autoFocus
                className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 min-w-0"
              />
              <button
                type="submit"
                disabled={editSaving || !editDraft.trim()}
                className="w-7 h-7 rounded-md bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
              >
                {editSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => { setIsEditing(false); setEditDraft(''); }}
                className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : message.deleted_at ? (
            <span className="italic opacity-60">[deleted]</span>
          ) : isFlagged ? (
            <span className="italic opacity-60">[This message was removed]</span>
          ) : (
            message.body
          )}

          <p className={`text-[10px] mt-1 ${isMine ? 'text-white/70' : 'text-gray-500'}`}>
            {new Date(message.created_at).toLocaleTimeString('en-AE', { hour: 'numeric', minute: '2-digit' })}
            {message.edited_at && !message.deleted_at && !isFlagged && ' · edited'}
          </p>
        </div>

        {/* Message actions */}
        {showActions && (
          <div className="absolute -top-2 right-0 opacity-0 group-hover/message:opacity-100 focus-within:opacity-100 transition-opacity">
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="w-6 h-6 rounded-full bg-[#0f1724] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white"
              >
                <MoreVertical className="w-3 h-3" />
              </button>
              {menuOpen && (
                <>
                  <div className="absolute right-0 mt-1 w-24 rounded-lg border border-white/10 bg-[#0f1724] shadow-xl overflow-hidden z-10">
                    <button
                      onClick={startEdit}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-gray-300 hover:bg-white/5 hover:text-white"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                  <button
                    className="fixed inset-0 z-0"
                    aria-hidden="true"
                    onClick={() => setMenuOpen(false)}
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
