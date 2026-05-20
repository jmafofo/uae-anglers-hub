'use client';

import { useState } from 'react';
import { Flag, X, Check, Loader2 } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

const CATEGORIES = [
  { value: 'spam',            label: 'Spam or promotional' },
  { value: 'abuse',           label: 'Abuse, harassment or threats' },
  { value: 'wrong_category',  label: 'Wrong category' },
  { value: 'misinformation',  label: 'Misinformation' },
  { value: 'other',           label: 'Other (please explain)' },
] as const;

const REASON_MAX = 500;

interface ReportButtonProps {
  targetType: 'thread' | 'reply' | 'catch_comment';
  targetId: string;
  /** Optional className for the trigger button */
  className?: string;
  /** Optional label shown next to the flag icon */
  label?: string;
}

const TARGET_LABEL: Record<ReportButtonProps['targetType'], string> = {
  thread:        'thread',
  reply:         'reply',
  catch_comment: 'comment',
};

/**
 * Inline "Report" trigger + modal. Posts to /api/forum/report. Used
 * on both thread and reply views.
 */
export default function ReportButton({
  targetType, targetId, className, label,
}: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<typeof CATEGORIES[number]['value']>('spam');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    setError(null);
    setSubmitting(true);
    const sb = getSupabase();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
      setError('Sign in to report.');
      setSubmitting(false);
      return;
    }
    const res = await fetch('/api/forum/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        target_type: targetType,
        target_id:   targetId,
        category,
        reason: reason.trim() || undefined,
      }),
    });
    const body = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      setError(body.error || 'Could not submit report.');
      return;
    }
    setDone(true);
  }

  function close() {
    setOpen(false);
    // Reset after the fade so the modal doesn't flash old state next time
    setTimeout(() => {
      setCategory('spam');
      setReason('');
      setError(null);
      setDone(false);
    }, 200);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Report ${TARGET_LABEL[targetType]}`}
        className={
          className ??
          'inline-flex items-center gap-1 text-gray-500 hover:text-red-400 transition-colors'
        }
      >
        <Flag className="w-3.5 h-3.5" />
        {label && <span>{label}</span>}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-modal-title"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#0a0f1a] border border-white/10 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 id="report-modal-title" className="text-white font-bold text-base">
                {done ? 'Report submitted' : `Report this ${TARGET_LABEL[targetType]}`}
              </h2>
              <button
                onClick={close}
                aria-label="Close"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {done ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-5 h-5 text-teal-400" />
                </div>
                <p className="text-gray-300 text-sm">
                  Thanks — a moderator will review this shortly.
                </p>
                <button
                  onClick={close}
                  className="mt-5 px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                    {error}
                  </div>
                )}

                <fieldset className="space-y-2">
                  <legend className="text-xs font-medium text-gray-400 mb-1">Reason</legend>
                  {CATEGORIES.map((c) => (
                    <label
                      key={c.value}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                        category === c.value
                          ? 'border-teal-500/40 bg-teal-500/5 text-white'
                          : 'border-white/10 bg-white/[0.02] text-gray-300 hover:border-white/20'
                      }`}
                    >
                      <input
                        type="radio"
                        name="report-category"
                        value={c.value}
                        checked={category === c.value}
                        onChange={() => setCategory(c.value)}
                        className="accent-teal-500"
                      />
                      {c.label}
                    </label>
                  ))}
                </fieldset>

                <div>
                  <label htmlFor="report-reason" className="block text-xs font-medium text-gray-400 mb-1">
                    Additional context (optional)
                  </label>
                  <textarea
                    id="report-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value.slice(0, REASON_MAX))}
                    rows={3}
                    maxLength={REASON_MAX}
                    placeholder="What should the moderator know?"
                    className="w-full bg-white/5 border border-white/10 focus:border-teal-500 rounded-lg px-3 py-2 text-white placeholder-gray-500 outline-none text-sm resize-none"
                  />
                  <p className="text-[10px] text-gray-600 mt-1 text-right">
                    {reason.length}/{REASON_MAX}
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={close}
                    disabled={submitting}
                    className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submit}
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 disabled:bg-red-700 text-white text-sm font-semibold"
                  >
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Flag className="w-3.5 h-3.5" />}
                    Submit report
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
