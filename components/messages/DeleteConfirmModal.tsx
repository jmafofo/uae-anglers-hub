'use client';

import { Trash2, LogOut, Loader2 } from 'lucide-react';
import type { ConversationView } from './types';

interface DeleteConfirmModalProps {
  conversation: ConversationView;
  userId: string;
  deletingId: string | null;
  onCancel: () => void;
  onConfirm: (conv: ConversationView) => void;
}

export default function DeleteConfirmModal({
  conversation,
  userId,
  deletingId,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  const isAdmin = conversation.type === 'group' && (conversation.created_by === userId || conversation.my_role === 'admin');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-[#0a0f1a] border border-white/10 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-white font-bold text-base mb-2">
          {isAdmin ? 'Delete group?' : 'Leave conversation?'}
        </h2>
        <p className="text-gray-400 text-sm mb-5">
          {isAdmin
            ? `This will permanently delete "${conversation.display_name}" and all its messages for everyone.`
            : `You will be removed from "${conversation.display_name}". This cannot be undone.`}
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white text-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(conversation)}
            disabled={deletingId === conversation.id}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 disabled:bg-red-800 text-white text-sm font-semibold transition-colors"
          >
            {deletingId === conversation.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isAdmin ? <Trash2 className="w-3.5 h-3.5" /> : <LogOut className="w-3.5 h-3.5" />}
            {isAdmin ? 'Delete' : 'Leave'}
          </button>
        </div>
      </div>
    </div>
  );
}
