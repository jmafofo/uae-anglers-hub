'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ThumbsUp, MessageSquare, Send, Lock } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

interface Thread {
  id: string; title: string; body: string; upvotes: number; reply_count: number;
  is_locked: boolean; created_at: string; tags: string[];
  profiles: { display_name: string; username: string };
  forum_categories: { name: string; slug: string };
}

interface Reply {
  id: string; body: string; upvotes: number; is_helpful: boolean; created_at: string;
  profiles: { display_name: string; username: string };
}

export default function ThreadPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [thread, setThread] = useState<Thread | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newReply, setNewReply] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const sb = getSupabase();
      const [{ data: t }, { data: r }, { data: { user } }] = await Promise.all([
        sb.from('forum_threads').select('*, profiles(display_name,username), forum_categories(name,slug)').eq('id', id).single(),
        sb.from('forum_replies').select('*, profiles(display_name,username)').eq('thread_id', id).order('created_at'),
        sb.auth.getUser(),
      ]);
      setThread(t);
      setReplies(r ?? []);
      setUserId(user?.id ?? null);
      setLoading(false);
    }
    load();
  }, [id]);

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!newReply.trim() || !userId) { if (!userId) router.push('/login'); return; }
    setPosting(true);
    const sb = getSupabase();
    const { data } = await sb.from('forum_replies')
      .insert({ thread_id: id, user_id: userId, body: newReply.trim() })
      .select('*, profiles(display_name,username)').single();
    if (data) { setReplies((r) => [...r, data as Reply]); setNewReply(''); }
    setPosting(false);
  }

  async function upvoteThread() {
    if (!userId) { router.push('/login'); return; }
    await getSupabase().from('forum_threads').update({ upvotes: (thread?.upvotes ?? 0) + 1 }).eq('id', id);
    setThread((t) => t ? { ...t, upvotes: t.upvotes + 1 } : t);
  }

  if (loading) return <div className="min-h-screen pt-20 flex items-center justify-center text-gray-500">Loading thread...</div>;
  if (!thread) return <div className="min-h-screen pt-20 flex items-center justify-center text-gray-500">Thread not found.</div>;

  return (
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="max-w-3xl mx-auto">
        <Link href={`/forum/${(thread.forum_categories as { slug: string })?.slug}`} className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {(thread.forum_categories as { name: string })?.name}
        </Link>

        {/* Thread */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-6">
          <h1 className="text-2xl font-extrabold text-white mb-3">{thread.title}</h1>
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-5">
            <span>by <Link href={`/profile/${(thread.profiles as { username: string })?.username}`} className="text-teal-400 hover:underline">{(thread.profiles as { display_name: string })?.display_name}</Link></span>
            <span>{new Date(thread.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{thread.body}</p>
          {thread.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {thread.tags.map((tag) => (
                <span key={tag} className="text-xs bg-white/5 text-gray-400 border border-white/10 px-2.5 py-1 rounded-full">#{tag}</span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-4 mt-5 pt-4 border-t border-white/10">
            <button onClick={upvoteThread} className="flex items-center gap-1.5 text-gray-500 hover:text-teal-400 transition-colors text-sm">
              <ThumbsUp className="w-4 h-4" /> {thread.upvotes}
            </button>
            <span className="flex items-center gap-1.5 text-gray-600 text-sm">
              <MessageSquare className="w-4 h-4" /> {replies.length} replies
            </span>
          </div>
        </div>

        {/* Replies */}
        {replies.length > 0 && (
          <div className="space-y-4 mb-8">
            {replies.map((r, i) => (
              <div key={r.id} className={`p-5 rounded-xl border transition-colors ${r.is_helpful ? 'bg-teal-500/5 border-teal-500/30' : 'bg-white/5 border-white/10'}`}>
                {r.is_helpful && <div className="text-xs text-teal-400 font-semibold mb-2">✓ Marked as helpful</div>}
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{r.body}</p>
                <div className="flex items-center justify-between mt-3 text-xs text-gray-600">
                  <span>#{i + 1} · <Link href={`/profile/${(r.profiles as { username: string })?.username}`} className="text-teal-400 hover:underline">{(r.profiles as { display_name: string })?.display_name}</Link> · {new Date(r.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' })}</span>
                  <button className="flex items-center gap-1 hover:text-teal-400 transition-colors">
                    <ThumbsUp className="w-3 h-3" /> {r.upvotes}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reply form */}
        {thread.is_locked ? (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 text-gray-500 text-sm">
            <Lock className="w-4 h-4" /> This thread is locked.
          </div>
        ) : (
          <form onSubmit={submitReply} className="p-5 rounded-xl bg-white/5 border border-white/10">
            <h3 className="font-semibold text-white mb-3">Leave a Reply</h3>
            <textarea
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              rows={4}
              placeholder={userId ? 'Share your thoughts...' : 'Sign in to reply'}
              disabled={!userId}
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
