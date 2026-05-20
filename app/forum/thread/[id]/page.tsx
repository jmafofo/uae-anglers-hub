'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ThumbsUp, ThumbsDown, MessageSquare, Send, Lock, Eye, UserCheck,
  Pencil, Trash2, Check, X, ChevronDown,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { renderBodyWithMentions, friendlyForumError } from '@/lib/forum';
import ReportButton from '@/components/ReportButton';

const REPLIES_PAGE_SIZE = 30;

interface Thread {
  id: string; user_id: string; title: string; body: string;
  upvotes: number; downvotes: number; reply_count: number;
  is_locked: boolean; created_at: string; edited_at: string | null;
  deleted_at: string | null; deleted_reason: string | null;
  tags: string[]; visibility: string;
  profiles: { display_name: string; username: string };
  forum_categories: { name: string; slug: string };
}

interface Reply {
  id: string; user_id: string; body: string;
  upvotes: number; downvotes: number; is_helpful: boolean;
  created_at: string; edited_at: string | null;
  deleted_at: string | null; deleted_reason: string | null;
  profiles: { display_name: string; username: string };
}

/**
 * Merge raw reply rows with author profiles fetched separately.
 * This avoids fragile PostgREST joins that can fail silently when
 * RLS or foreign-key relationships fluctuate.
 */
async function mergeReplyProfiles(
  sb: ReturnType<typeof getSupabase>,
  rows: Record<string, unknown>[],
): Promise<Reply[]> {
  if (rows.length === 0) return [];
  const userIds = [...new Set(rows.map((r) => r.user_id as string))];
  const { data: profiles } = userIds.length
    ? await sb.from('profiles').select('id,display_name,username').in('id', userIds)
    : { data: [] };
  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p as { display_name: string; username: string }]),
  );
  return rows.map((r) => ({
    ...r,
    profiles: profileMap.get(r.user_id as string) ?? { display_name: 'Angler', username: '' },
  })) as Reply[];
}

type VoteValue = 1 | -1;

const VISIBILITY_LABEL: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  public: { label: 'Public', icon: <Eye className="w-3.5 h-3.5" />, color: 'text-gray-500' },
  followers: { label: 'Followers only', icon: <UserCheck className="w-3.5 h-3.5" />, color: 'text-amber-400' },
  private: { label: 'Private', icon: <Lock className="w-3.5 h-3.5" />, color: 'text-rose-400' },
};

export default function ThreadPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [thread, setThread] = useState<Thread | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newReply, setNewReply] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);

  // Map of "type:id" → viewer's vote on that target (1 = up, -1 = down,
  // missing = no vote).
  const [votes, setVotes] = useState<Map<string, VoteValue>>(new Map());

  // Set of user_ids the viewer has blocked
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  // Per-reply "show anyway" override for blocked content
  const [revealedReplies, setRevealedReplies] = useState<Set<string>>(new Set());

  // Reply pagination: track the count of replies actually loaded from
  // the server, not replies.length — local optimistic inserts (new
  // posts) shouldn't shift the server-side offset.
  const [loadedFromServer, setLoadedFromServer] = useState(0);
  const [hasMoreReplies, setHasMoreReplies] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Edit state
  const [editingThread, setEditingThread] = useState(false);
  const [threadDraft, setThreadDraft] = useState('');
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
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

      const { data: t, error: threadError } = await sb
        .from('forum_threads')
        .select('*')
        .eq('id', id)
        .single();

      if (threadError || !t) {
        console.error('[thread load] thread fetch error:', threadError);
        setError('Thread not found or you do not have permission to view it.');
        setLoading(false);
        return;
      }

      // Fetch author + category separately so a join failure doesn't hide the thread.
      const [{ data: author }, { data: category }] = await Promise.all([
        sb.from('profiles').select('display_name,username').eq('id', t.user_id).maybeSingle(),
        sb.from('forum_categories').select('name,slug').eq('id', t.category_id).maybeSingle(),
      ]);

      setThread({
        ...t,
        profiles: author ?? { display_name: 'Angler', username: '' },
        forum_categories: category ?? { name: 'Forum', slug: '' },
      } as Thread);

      // Fetch one extra row to detect "load more" without a COUNT query.
      const { data: r } = await sb
        .from('forum_replies')
        .select('*')
        .eq('thread_id', id)
        .order('created_at')
        .range(0, REPLIES_PAGE_SIZE);
      const replyRows = (r ?? []).slice(0, REPLIES_PAGE_SIZE);
      const replyList = await mergeReplyProfiles(sb, replyRows);
      setReplies(replyList);
      setLoadedFromServer(replyList.length);
      setHasMoreReplies((r ?? []).length > REPLIES_PAGE_SIZE);

      // Batch-load the viewer's votes for this thread + all its replies.
      if (user) {
        const replyIds = replyList.map((row: Reply) => row.id);
        const orFilter = [
          `and(target_type.eq.thread,target_id.eq.${id})`,
          replyIds.length
            ? `and(target_type.eq.reply,target_id.in.(${replyIds.join(',')}))`
            : null,
        ].filter(Boolean).join(',');
        const { data: v } = await sb
          .from('forum_votes')
          .select('target_type, target_id, value')
          .eq('user_id', user.id)
          .or(orFilter);
        const m = new Map<string, VoteValue>();
        for (const row of v ?? []) m.set(`${row.target_type}:${row.target_id}`, row.value as VoteValue);
        setVotes(m);
      }

      setLoading(false);
    }
    load();
  }, [id]);

  async function loadMoreReplies() {
    if (loadingMore || !hasMoreReplies) return;
    setLoadingMore(true);
    const sb = getSupabase();
    const offset = loadedFromServer;
    const { data, error: loadErr } = await sb
      .from('forum_replies')
      .select('*')
      .eq('thread_id', id)
      .order('created_at')
      .range(offset, offset + REPLIES_PAGE_SIZE);
    setLoadingMore(false);
    if (loadErr || !data) return;
    const moreRows = data.slice(0, REPLIES_PAGE_SIZE);
    const more = await mergeReplyProfiles(sb, moreRows);
    // Splice older server-fetched replies in just before any
    // optimistically-inserted local replies (those have created_at
    // newer than everything we're loading).
    setReplies((prev) => {
      const localAdditions = prev.slice(loadedFromServer);
      const serverBatch = prev.slice(0, loadedFromServer);
      return [...serverBatch, ...more, ...localAdditions];
    });
    setLoadedFromServer((n) => n + more.length);
    setHasMoreReplies(data.length > REPLIES_PAGE_SIZE);

    // Refresh the viewer's votes for the newly loaded replies
    if (userId && more.length) {
      const replyIds = more.map((row) => (row as Reply).id);
      const { data: v } = await sb
        .from('forum_votes')
        .select('target_type, target_id, value')
        .eq('user_id', userId)
        .eq('target_type', 'reply')
        .in('target_id', replyIds);
      if (v?.length) {
        setVotes((prev) => {
          const next = new Map(prev);
          for (const row of v) next.set(`${row.target_type}:${row.target_id}`, row.value as VoteValue);
          return next;
        });
      }
    }
  }

  /**
   * Set the viewer's vote on a target.
   *   direction: 1 = upvote, -1 = downvote
   *
   * If the user clicks the button matching their current vote, the
   * vote is removed (toggle off). Switching direction is a single
   * UPDATE on the existing row.
   */
  async function setVote(targetType: 'thread' | 'reply', targetId: string, direction: VoteValue) {
    if (!userId) { router.push('/login'); return; }
    const key = `${targetType}:${targetId}`;
    const sb = getSupabase();
    const current = votes.get(key); // 1 | -1 | undefined

    // Figure out which counters move and by how much.
    // upDelta is applied to .upvotes, downDelta to .downvotes.
    let upDelta = 0;
    let downDelta = 0;
    let action: 'insert' | 'delete' | 'update';
    let nextLocal: VoteValue | null;
    if (current === undefined) {
      action = 'insert';
      nextLocal = direction;
      if (direction === 1) upDelta = +1; else downDelta = +1;
    } else if (current === direction) {
      // Click the same button → remove vote
      action = 'delete';
      nextLocal = null;
      if (direction === 1) upDelta = -1; else downDelta = -1;
    } else {
      // Switch direction → 1 → -1 swaps a + for a -
      action = 'update';
      nextLocal = direction;
      if (direction === 1) { upDelta = +1; downDelta = -1; }
      else                 { upDelta = -1; downDelta = +1; }
    }

    // Optimistic local update
    setVotes((prev) => {
      const next = new Map(prev);
      if (nextLocal === null) next.delete(key); else next.set(key, nextLocal);
      return next;
    });
    const applyDelta = (row: { upvotes: number; downvotes: number }) => ({
      ...row,
      upvotes: Math.max(0, row.upvotes + upDelta),
      downvotes: Math.max(0, row.downvotes + downDelta),
    });
    if (targetType === 'thread') {
      setThread((t) => t ? { ...t, ...applyDelta(t) } : t);
    } else {
      setReplies((rs) => rs.map((r) => r.id === targetId ? { ...r, ...applyDelta(r) } : r));
    }

    // Persist
    const { error: voteErr } =
      action === 'insert'
        ? await sb.from('forum_votes').insert({
            user_id: userId,
            target_type: targetType,
            target_id: targetId,
            value: direction,
          })
        : action === 'update'
          ? await sb.from('forum_votes')
              .update({ value: direction })
              .eq('user_id', userId)
              .eq('target_type', targetType)
              .eq('target_id', targetId)
          : await sb.from('forum_votes').delete()
              .eq('user_id', userId)
              .eq('target_type', targetType)
              .eq('target_id', targetId);

    if (voteErr) {
      console.warn('[forum vote]', voteErr);
      // Roll back local state on failure
      setVotes((prev) => {
        const next = new Map(prev);
        if (current === undefined) next.delete(key); else next.set(key, current);
        return next;
      });
      const rollback = { upvotes: -upDelta, downvotes: -downDelta };
      if (targetType === 'thread') {
        setThread((t) => t ? {
          ...t,
          upvotes: Math.max(0, t.upvotes + rollback.upvotes),
          downvotes: Math.max(0, t.downvotes + rollback.downvotes),
        } : t);
      } else {
        setReplies((rs) => rs.map((r) => r.id === targetId ? {
          ...r,
          upvotes: Math.max(0, r.upvotes + rollback.upvotes),
          downvotes: Math.max(0, r.downvotes + rollback.downvotes),
        } : r));
      }
    }
  }

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    setReplyError(null);
    if (!newReply.trim() || !userId) { if (!userId) router.push('/login'); return; }
    setPosting(true);
    const sb = getSupabase();
    const { data: inserted, error: insertErr } = await sb.from('forum_replies')
      .insert({ thread_id: id, user_id: userId, body: newReply.trim() })
      .select('*')
      .single();
    if (insertErr) {
      setReplyError(friendlyForumError(insertErr) ?? insertErr.message ?? 'Could not post reply.');
    } else if (inserted) {
      // Attach the current user's profile so the reply renders immediately.
      const { data: me } = await sb.from('profiles')
        .select('display_name,username')
        .eq('id', userId)
        .maybeSingle();
      const reply: Reply = {
        ...inserted,
        profiles: me ?? { display_name: 'Angler', username: '' },
      } as Reply;
      setReplies((r) => [...r, reply]);
      // The new row now exists on the server with the highest
      // created_at — bump the server offset so the next "load more"
      // doesn't fetch it again as a duplicate.
      setLoadedFromServer((n) => n + 1);
      setNewReply('');
    }
    setPosting(false);
  }

  function startEditThread() {
    if (!thread) return;
    setThreadDraft(thread.body);
    setEditingThread(true);
  }

  async function saveThreadEdit() {
    if (!thread || !threadDraft.trim()) return;
    setSaveBusy(true);
    const sb = getSupabase();
    const { data, error: updErr } = await sb
      .from('forum_threads')
      .update({ body: threadDraft.trim() })
      .eq('id', thread.id)
      .select('edited_at')
      .single();
    setSaveBusy(false);
    if (updErr) {
      setError(updErr.message);
      return;
    }
    setThread((t) => t ? { ...t, body: threadDraft.trim(), edited_at: data?.edited_at ?? new Date().toISOString() } : t);
    setEditingThread(false);
  }

  async function deleteThread() {
    if (!thread) return;
    if (!confirm('Delete this thread? This cannot be undone.')) return;
    const sb = getSupabase();
    const { error: delErr } = await sb.from('forum_threads').delete().eq('id', thread.id);
    if (delErr) { setError(delErr.message); return; }
    router.push(`/forum/${thread.forum_categories?.slug ?? ''}`);
  }

  function startEditReply(r: Reply) {
    setEditingReplyId(r.id);
    setReplyDraft(r.body);
  }

  async function saveReplyEdit(replyId: string) {
    if (!replyDraft.trim()) return;
    setSaveBusy(true);
    const sb = getSupabase();
    const { data, error: updErr } = await sb
      .from('forum_replies')
      .update({ body: replyDraft.trim() })
      .eq('id', replyId)
      .select('edited_at')
      .single();
    setSaveBusy(false);
    if (updErr) { setReplyError(updErr.message); return; }
    setReplies((rs) => rs.map((r) =>
      r.id === replyId ? { ...r, body: replyDraft.trim(), edited_at: data?.edited_at ?? new Date().toISOString() } : r
    ));
    setEditingReplyId(null);
  }

  async function deleteReply(replyId: string) {
    if (!confirm('Delete this reply?')) return;
    const sb = getSupabase();
    const { error: delErr } = await sb.from('forum_replies').delete().eq('id', replyId);
    if (delErr) { setReplyError(delErr.message); return; }
    setReplies((rs) => rs.filter((r) => r.id !== replyId));
  }

  if (loading) return <div className="min-h-screen pt-20 flex items-center justify-center text-gray-500">Loading thread...</div>;

  if (error || !thread) {
    return (
      <div className="min-h-screen pt-20 px-4 pb-16">
        <div className="max-w-3xl mx-auto">
          <Link href="/forum" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Forum
          </Link>
          <div className="p-10 text-center rounded-2xl bg-white/5 border border-white/10">
            <Lock className="w-10 h-10 mx-auto mb-3 text-gray-600" />
            <h1 className="text-lg font-bold text-white mb-1">{error ?? 'Thread not found'}</h1>
            <p className="text-sm text-gray-500 mb-4">
              This thread may be private, restricted to followers, or may not exist.
            </p>
            <Link href="/forum" className="text-teal-400 hover:underline text-sm">
              Browse all threads
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const vis = VISIBILITY_LABEL[thread.visibility] ?? VISIBILITY_LABEL.public;
  const isThreadAuthor = userId && thread.user_id === userId;

  // Show the real body to author + admins; show a tombstone to everyone else.
  function bodyOrTombstone(row: { body: string; user_id: string; deleted_at: string | null }) {
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
    return <span className="italic text-gray-500">[This content was removed by a moderator]</span>;
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="max-w-3xl mx-auto">
        <Link href={`/forum/${thread.forum_categories?.slug}`} className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {thread.forum_categories?.name}
        </Link>

        {/* Thread */}
        <article className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-6" aria-label="Thread">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className={`flex items-center gap-1 text-xs ${vis.color} bg-white/5 border border-white/10 px-2 py-0.5 rounded-full`}>
              {vis.icon} {vis.label}
            </span>
            <div className="flex items-center gap-2">
              {isThreadAuthor && !editingThread && !thread.is_locked && (
                <>
                  <button
                    onClick={startEditThread}
                    aria-label="Edit thread"
                    className="p-1.5 rounded-md text-gray-500 hover:text-teal-400 hover:bg-white/5 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={deleteThread}
                    aria-label="Delete thread"
                    className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-white/5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              {userId && !isThreadAuthor && (
                <ReportButton
                  targetType="thread"
                  targetId={thread.id}
                  className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-white/5 transition-colors"
                />
              )}
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-3">{thread.title}</h1>
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-5">
            <span>by <Link href={`/profile/${thread.profiles?.username}`} className="text-teal-400 hover:underline">{thread.profiles?.display_name}</Link></span>
            <span>{new Date(thread.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            {thread.edited_at && (
              <span className="italic" title={new Date(thread.edited_at).toLocaleString()}>edited</span>
            )}
          </div>

          {editingThread ? (
            <div className="space-y-3">
              <textarea
                value={threadDraft}
                onChange={(e) => setThreadDraft(e.target.value)}
                rows={8}
                aria-label="Edit thread body"
                className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-4 py-3 text-white outline-none text-sm resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditingThread(false)}
                  disabled={saveBusy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white text-sm"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
                <button
                  onClick={saveThreadEdit}
                  disabled={saveBusy || !threadDraft.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 disabled:bg-teal-700 text-white text-sm font-semibold"
                >
                  <Check className="w-3.5 h-3.5" /> Save
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {bodyOrTombstone(thread)}
            </p>
          )}

          {thread.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {thread.tags.map((tag) => (
                <span key={tag} className="text-xs bg-white/5 text-gray-400 border border-white/10 px-2.5 py-1 rounded-full">#{tag}</span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-4 mt-5 pt-4 border-t border-white/10">
            {(() => {
              const v = votes.get(`thread:${thread.id}`);
              return (
                <>
                  <button
                    onClick={() => setVote('thread', thread.id, 1)}
                    aria-pressed={v === 1}
                    aria-label={v === 1 ? 'Remove upvote' : 'Upvote thread'}
                    className={`flex items-center gap-1.5 transition-colors text-sm ${
                      v === 1 ? 'text-teal-400' : 'text-gray-500 hover:text-teal-400'
                    }`}
                  >
                    <ThumbsUp className={`w-4 h-4 ${v === 1 ? 'fill-current' : ''}`} /> {thread.upvotes}
                  </button>
                  <button
                    onClick={() => setVote('thread', thread.id, -1)}
                    aria-pressed={v === -1}
                    aria-label={v === -1 ? 'Remove downvote' : 'Downvote thread'}
                    className={`flex items-center gap-1.5 transition-colors text-sm ${
                      v === -1 ? 'text-rose-400' : 'text-gray-500 hover:text-rose-400'
                    }`}
                  >
                    <ThumbsDown className={`w-4 h-4 ${v === -1 ? 'fill-current' : ''}`} /> {thread.downvotes}
                  </button>
                </>
              );
            })()}
            <span className="flex items-center gap-1.5 text-gray-600 text-sm ml-auto">
              <MessageSquare className="w-4 h-4" /> {replies.length} replies
            </span>
          </div>
        </article>

        {/* Replies */}
        {replies.length > 0 && (
          <section aria-label="Replies" className="space-y-4 mb-8">
            {replies.map((r, i) => {
              const isReplyAuthor = userId && r.user_id === userId;
              const isEditing = editingReplyId === r.id;
              return (
                <article
                  key={r.id}
                  aria-label={`Reply ${i + 1} by ${r.profiles?.display_name ?? 'anonymous'}`}
                  className={`p-5 rounded-xl border transition-colors ${r.is_helpful ? 'bg-teal-500/5 border-teal-500/30' : 'bg-white/5 border-white/10'}`}
                >
                  {r.is_helpful && <div className="text-xs text-teal-400 font-semibold mb-2">✓ Marked as helpful</div>}
                  {isEditing ? (
                    <div className="space-y-3">
                      <textarea
                        value={replyDraft}
                        onChange={(e) => setReplyDraft(e.target.value)}
                        rows={4}
                        aria-label="Edit reply body"
                        className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-4 py-2.5 text-white outline-none text-sm resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingReplyId(null)}
                          disabled={saveBusy}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white text-xs"
                        >
                          <X className="w-3 h-3" /> Cancel
                        </button>
                        <button
                          onClick={() => saveReplyEdit(r.id)}
                          disabled={saveBusy || !replyDraft.trim()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 disabled:bg-teal-700 text-white text-xs font-semibold"
                        >
                          <Check className="w-3 h-3" /> Save
                        </button>
                      </div>
                    </div>
                  ) : blockedIds.has(r.user_id) && !revealedReplies.has(r.id) ? (
                    <div className="flex items-center justify-between gap-3 text-xs italic text-gray-500 py-1">
                      <span>Reply from a blocked user is hidden.</span>
                      <button
                        onClick={() => setRevealedReplies((s) => new Set(s).add(r.id))}
                        className="text-teal-400 hover:underline not-italic"
                      >
                        Show anyway
                      </button>
                    </div>
                  ) : (
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {bodyOrTombstone(r)}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3 text-xs text-gray-600">
                    <span>
                      #{i + 1} ·{' '}
                      <Link href={`/profile/${r.profiles?.username}`} className="text-teal-400 hover:underline">
                        {r.profiles?.display_name}
                      </Link>{' '}
                      · {new Date(r.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' })}
                      {r.edited_at && (
                        <span className="italic ml-2" title={new Date(r.edited_at).toLocaleString()}>(edited)</span>
                      )}
                    </span>
                    <div className="flex items-center gap-3">
                      {isReplyAuthor && !isEditing && (
                        <>
                          <button
                            onClick={() => startEditReply(r)}
                            aria-label="Edit reply"
                            className="text-gray-500 hover:text-teal-400 transition-colors"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteReply(r.id)}
                            aria-label="Delete reply"
                            className="text-gray-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                      {userId && !isReplyAuthor && !r.deleted_at && (
                        <ReportButton
                          targetType="reply"
                          targetId={r.id}
                          className="text-gray-500 hover:text-red-400 transition-colors"
                        />
                      )}
                      {(() => {
                        const v = votes.get(`reply:${r.id}`);
                        return (
                          <>
                            <button
                              onClick={() => setVote('reply', r.id, 1)}
                              aria-pressed={v === 1}
                              aria-label={v === 1 ? 'Remove upvote' : 'Upvote reply'}
                              className={`flex items-center gap-1 transition-colors ${
                                v === 1 ? 'text-teal-400' : 'hover:text-teal-400'
                              }`}
                            >
                              <ThumbsUp className={`w-3 h-3 ${v === 1 ? 'fill-current' : ''}`} /> {r.upvotes}
                            </button>
                            <button
                              onClick={() => setVote('reply', r.id, -1)}
                              aria-pressed={v === -1}
                              aria-label={v === -1 ? 'Remove downvote' : 'Downvote reply'}
                              className={`flex items-center gap-1 transition-colors ${
                                v === -1 ? 'text-rose-400' : 'hover:text-rose-400'
                              }`}
                            >
                              <ThumbsDown className={`w-3 h-3 ${v === -1 ? 'fill-current' : ''}`} /> {r.downvotes}
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </article>
              );
            })}

            {hasMoreReplies && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={loadMoreReplies}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-teal-500/40 text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                >
                  <ChevronDown className={`w-3.5 h-3.5 ${loadingMore ? 'animate-bounce' : ''}`} />
                  {loadingMore ? 'Loading…' : `Load ${REPLIES_PAGE_SIZE} more replies`}
                </button>
              </div>
            )}
          </section>
        )}

        {/* Reply form */}
        {thread.is_locked ? (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 text-gray-500 text-sm">
            <Lock className="w-4 h-4" /> This thread is locked.
          </div>
        ) : (
          <form onSubmit={submitReply} className="p-5 rounded-xl bg-white/5 border border-white/10">
            <h3 className="font-semibold text-white mb-3">Leave a Reply</h3>
            {replyError && (
              <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {replyError}
              </div>
            )}
            <textarea
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              rows={4}
              placeholder={userId ? 'Share your thoughts… use @username to tag someone' : 'Sign in to reply'}
              disabled={!userId}
              aria-label="Reply body"
              className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none text-sm resize-none disabled:opacity-50"
            />
            <div className="flex justify-end mt-3">
              {userId ? (
                <button type="submit" disabled={posting || !newReply.trim()} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 disabled:bg-teal-700 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                  <Send className="w-4 h-4" /> {posting ? 'Posting...' : 'Post Reply'}
                </button>
              ) : (
                <Link href="/login" className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-5 py-2.5 rounded-lg text-sm font-semibold">
                  Sign in to reply
                </Link>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
