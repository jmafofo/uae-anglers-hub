'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Fish, MapPin, MessageSquare, Send, Pencil, Trash2,
  Check, X,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { renderBodyWithMentions, friendlyForumError } from '@/lib/forum';
import ReportButton from '@/components/ReportButton';

interface CatchRow {
  id: string;
  user_id: string;
  species: string;
  weight_kg: number | null;
  length_cm: number | null;
  location_name: string | null;
  emirate: string | null;
  photo_url: string | null;
  photo_urls: string[] | null;
  caught_at: string;
  bait: string | null;
  notes: string | null;
  comment_count: number;
  profiles: { display_name: string; username: string } | null;
}

interface Comment {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  profiles: { display_name: string; username: string };
}

export default function CatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [c, setC] = useState<CatchRow | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);

  // Edit state for comments
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [saveBusy, setSaveBusy] = useState(false);

  useEffect(() => {
    async function load() {
      const sb = getSupabase();
      const { data: { user } } = await sb.auth.getUser();
      setUserId(user?.id ?? null);
      if (user) {
        const [{ data: me }, { data: blocks }] = await Promise.all([
          sb.from('profiles').select('is_admin').eq('id', user.id).maybeSingle(),
          sb.from('blocked_users').select('blocked_id').eq('blocker_id', user.id),
        ]);
        setIsAdmin(Boolean(me?.is_admin));
        setBlockedIds(new Set((blocks ?? []).map((b: { blocked_id: string }) => b.blocked_id)));
      }

      const { data: catchRow, error: catchErr } = await sb
        .from('catches')
        .select('*, profiles(display_name, username)')
        .eq('id', id)
        .single();
      if (catchErr || !catchRow) {
        setError('Catch not found.');
        setLoading(false);
        return;
      }
      setC(catchRow as CatchRow);

      const { data: comments } = await sb
        .from('catch_comments')
        .select('*, profiles(display_name, username)')
        .eq('catch_id', id)
        .order('created_at');
      setComments((comments ?? []) as Comment[]);
      setLoading(false);
    }
    load();
  }, [id]);

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    setCommentError(null);
    if (!newComment.trim() || !userId) { if (!userId) router.push('/login'); return; }
    setPosting(true);
    const sb = getSupabase();
    const { data, error: insertErr } = await sb.from('catch_comments')
      .insert({ catch_id: id, user_id: userId, body: newComment.trim() })
      .select('*, profiles(display_name, username)').single();
    setPosting(false);
    if (insertErr) {
      setCommentError(friendlyForumError(insertErr) ?? insertErr.message ?? 'Could not post comment.');
      return;
    }
    if (data) {
      setComments((cs) => [...cs, data as Comment]);
      setNewComment('');
      // The DB trigger updates comment_count, but reflect it locally too.
      setC((cur) => cur ? { ...cur, comment_count: cur.comment_count + 1 } : cur);
    }
  }

  async function saveEdit(commentId: string) {
    if (!editDraft.trim()) return;
    setSaveBusy(true);
    const sb = getSupabase();
    const { data, error: updErr } = await sb
      .from('catch_comments')
      .update({ body: editDraft.trim() })
      .eq('id', commentId)
      .select('edited_at')
      .single();
    setSaveBusy(false);
    if (updErr) { setCommentError(updErr.message); return; }
    setComments((cs) => cs.map((x) => x.id === commentId
      ? { ...x, body: editDraft.trim(), edited_at: data?.edited_at ?? new Date().toISOString() }
      : x));
    setEditingId(null);
  }

  async function deleteComment(commentId: string) {
    if (!confirm('Delete this comment?')) return;
    const sb = getSupabase();
    const { error: delErr } = await sb.from('catch_comments').delete().eq('id', commentId);
    if (delErr) { setCommentError(delErr.message); return; }
    setComments((cs) => cs.filter((x) => x.id !== commentId));
    setC((cur) => cur ? { ...cur, comment_count: Math.max(0, cur.comment_count - 1) } : cur);
  }

  function bodyOrTombstone(row: Comment) {
    if (!row.deleted_at) return renderBodyWithMentions(row.body);
    if (isAdmin || row.user_id === userId) {
      return (
        <>
          <span className="block text-xs italic text-red-400 mb-2">
            [Removed by moderator — visible to you only]
          </span>
          {renderBodyWithMentions(row.body)}
        </>
      );
    }
    return <span className="italic text-gray-500">[This comment was removed by a moderator]</span>;
  }

  if (loading) return <div className="min-h-screen pt-20 flex items-center justify-center text-gray-500">Loading catch…</div>;
  if (error || !c) {
    return (
      <div className="min-h-screen pt-20 px-4 pb-16">
        <div className="max-w-3xl mx-auto">
          <Link href="/catches" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Catches
          </Link>
          <div className="p-10 text-center rounded-2xl bg-white/5 border border-white/10">
            <Fish className="w-10 h-10 mx-auto mb-3 text-gray-600" />
            <p className="text-white">{error ?? 'Catch not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="max-w-3xl mx-auto">
        <Link href="/catches" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Catches
        </Link>

        <article className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden mb-6" aria-label="Catch">
          {(c.photo_urls?.length ? c.photo_urls : c.photo_url ? [c.photo_url] : []).length > 0 && (
            <div className="bg-white/10 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={(c.photo_urls?.[0] ?? c.photo_url)!}
                alt={c.species}
                className="w-full h-72 object-cover"
              />
              {(c.photo_urls?.length ?? 0) > 1 && (
                <div className="grid grid-cols-4 gap-1 p-1">
                  {c.photo_urls!.slice(1).map((url, i) => (
                    <div key={url} className="aspect-square overflow-hidden rounded-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`${c.species} ${i + 2}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h1 className="text-xl font-extrabold text-white">{c.species}</h1>
                {c.weight_kg && <p className="text-teal-400 text-sm font-medium">{c.weight_kg} kg</p>}
              </div>
              <span className="text-xs text-gray-500 shrink-0">
                {new Date(c.caught_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            {c.location_name && (
              <p className="text-sm text-gray-400 flex items-center gap-1 mb-1">
                <MapPin className="w-3.5 h-3.5" />
                {c.location_name}{c.emirate && `, ${c.emirate}`}
              </p>
            )}
            {c.bait && <p className="text-xs text-gray-500">Bait: {c.bait}</p>}
            {c.notes && (
              <p className="text-sm text-gray-300 mt-3 whitespace-pre-wrap leading-relaxed">{c.notes}</p>
            )}
            {c.profiles && (
              <Link
                href={`/profile/${c.profiles.username}`}
                className="mt-4 pt-4 border-t border-white/10 inline-flex items-center gap-2 text-xs text-gray-500 hover:text-teal-400 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center text-white text-[10px] font-bold">
                  {c.profiles.display_name?.[0]?.toUpperCase()}
                </div>
                by {c.profiles.display_name}
              </Link>
            )}
          </div>
        </article>

        {/* Comments */}
        <section aria-label="Comments" className="space-y-4 mb-6">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-teal-400" />
            {c.comment_count} {c.comment_count === 1 ? 'comment' : 'comments'}
          </h2>

          {comments.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No comments yet — be the first.</p>
          ) : (
            comments.map((cm) => {
              const isAuthor = userId && cm.user_id === userId;
              const isEditing = editingId === cm.id;
              const isBlocked = blockedIds.has(cm.user_id) && !revealed.has(cm.id);
              return (
                <article
                  key={cm.id}
                  className="p-4 rounded-xl bg-white/5 border border-white/10"
                  aria-label={`Comment by ${cm.profiles?.display_name ?? 'anonymous'}`}
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <textarea
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        rows={3}
                        aria-label="Edit comment"
                        className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-3 py-2 text-white outline-none text-sm resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingId(null)} disabled={saveBusy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white text-xs">
                          <X className="w-3 h-3" /> Cancel
                        </button>
                        <button onClick={() => saveEdit(cm.id)} disabled={saveBusy || !editDraft.trim()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 disabled:bg-teal-700 text-white text-xs font-semibold">
                          <Check className="w-3 h-3" /> Save
                        </button>
                      </div>
                    </div>
                  ) : isBlocked ? (
                    <div className="flex items-center justify-between gap-3 text-xs italic text-gray-500 py-1">
                      <span>Comment from a blocked user is hidden.</span>
                      <button onClick={() => setRevealed((s) => new Set(s).add(cm.id))} className="text-teal-400 hover:underline not-italic">
                        Show anyway
                      </button>
                    </div>
                  ) : (
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {bodyOrTombstone(cm)}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3 text-xs text-gray-600">
                    <span>
                      <Link href={`/profile/${cm.profiles?.username}`} className="text-teal-400 hover:underline">
                        {cm.profiles?.display_name}
                      </Link>{' '}
                      · {new Date(cm.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' })}
                      {cm.edited_at && (
                        <span className="italic ml-2" title={new Date(cm.edited_at).toLocaleString()}>(edited)</span>
                      )}
                    </span>
                    <div className="flex items-center gap-3">
                      {isAuthor && !isEditing && !cm.deleted_at && (
                        <>
                          <button onClick={() => { setEditingId(cm.id); setEditDraft(cm.body); }} aria-label="Edit comment" className="text-gray-500 hover:text-teal-400 transition-colors">
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button onClick={() => deleteComment(cm.id)} aria-label="Delete comment" className="text-gray-500 hover:text-red-400 transition-colors">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                      {userId && !isAuthor && !cm.deleted_at && (
                        <ReportButton
                          targetType="catch_comment"
                          targetId={cm.id}
                          className="text-gray-500 hover:text-red-400 transition-colors"
                        />
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>

        {/* Comment form */}
        <form onSubmit={submitComment} className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h3 className="font-semibold text-white mb-3 text-sm">Leave a comment</h3>
          {commentError && (
            <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {commentError}
            </div>
          )}
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value.slice(0, 2000))}
            rows={3}
            maxLength={2000}
            placeholder={userId ? 'Use @username to tag someone' : 'Sign in to comment'}
            disabled={!userId}
            aria-label="Comment body"
            className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 outline-none text-sm resize-none disabled:opacity-50"
          />
          <div className="flex justify-end mt-3">
            {userId ? (
              <button type="submit" disabled={posting || !newComment.trim()} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 disabled:bg-teal-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-semibold">
                <Send className="w-3.5 h-3.5" /> {posting ? 'Posting…' : 'Post comment'}
              </button>
            ) : (
              <Link href="/login" className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                Sign in to comment
              </Link>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
