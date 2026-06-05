'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, Heart, MessageCircle, Share2, Send, Loader2 } from 'lucide-react';
import ImageCarousel from './ImageCarousel';
import { getAuthHeaders } from '@/lib/supabase';
import type { PostItem } from './PostCard';

interface CommentItem {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface PostDetailModalProps {
  post: PostItem;
  onClose: () => void;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' });
}

export default function PostDetailModal({ post, onClose }: PostDetailModalProps) {
  const [liked, setLiked] = useState(post.has_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [savingLike, setSavingLike] = useState(false);

  useEffect(() => {
    loadComments();
    trackView();
  }, [post.id]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, []);

  async function loadComments() {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingComments(false);
    }
  }

  async function trackView() {
    try {
      await fetch(`/api/posts/${post.id}/view`, { method: 'POST' });
    } catch {
      // ignore
    }
  }

  async function toggleLike() {
    if (savingLike) return;
    setSavingLike(true);
    try {
      const headers = { ...(await getAuthHeaders()), 'Content-Type': 'application/json' };
      const res = await fetch(`/api/posts/${post.id}/like`, { method: 'POST', headers });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikesCount((c) => (data.liked ? c + 1 : c - 1));
      }
    } catch {
      // ignore
    } finally {
      setSavingLike(false);
    }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || sendingComment) return;
    setSendingComment(true);
    try {
      const headers = { ...(await getAuthHeaders()), 'Content-Type': 'application/json' };
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ body: commentText.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.comment]);
        setCommentText('');
      }
    } catch {
      // ignore
    } finally {
      setSendingComment(false);
    }
  }

  const displayName = post.profile.display_name || post.profile.username;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col sm:flex-row w-full max-w-4xl max-h-[90vh] rounded-2xl bg-[#0a0f1a] border border-white/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Media */}
        <div className="flex-1 min-h-0 bg-black">
          <ImageCarousel media={post.media} aspectRatio="aspect-square sm:aspect-auto" className="h-full" />
        </div>

        {/* Details sidebar */}
        <div className="w-full sm:w-80 flex flex-col border-t sm:border-t-0 sm:border-l border-white/10">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-white/10">
            <Link href={`/profile/${post.profile.username}`}>
              <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center text-xs font-bold text-teal-400 overflow-hidden">
                {post.profile.avatar_url ? (
                  <img src={post.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  displayName[0]?.toUpperCase()
                )}
              </div>
            </Link>
            <div>
              <Link href={`/profile/${post.profile.username}`} className="text-sm font-semibold text-white hover:text-teal-400 transition-colors">
                {displayName}
              </Link>
              <p className="text-[11px] text-gray-500">{timeAgo(post.created_at)}</p>
            </div>
          </div>

          {/* Caption + Comments */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {post.caption && (
              <p className="text-sm text-gray-300">
                <Link href={`/profile/${post.profile.username}`} className="font-semibold text-white hover:text-teal-400 transition-colors mr-1">
                  {displayName}
                </Link>
                {post.caption}
              </p>
            )}

            {loadingComments ? (
              <div className="text-center text-gray-500 text-sm">
                <Loader2 className="w-4 h-4 inline animate-spin" />
              </div>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex gap-2">
                  <Link href={`/profile/${c.profiles.username}`}>
                    <div className="w-7 h-7 rounded-full bg-teal-500/10 flex items-center justify-center text-[10px] font-bold text-teal-400 overflow-hidden shrink-0">
                      {c.profiles.avatar_url ? (
                        <img src={c.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (c.profiles.display_name || c.profiles.username)[0]?.toUpperCase()
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300">
                      <Link href={`/profile/${c.profiles.username}`} className="font-semibold text-white hover:text-teal-400 transition-colors mr-1">
                        {c.profiles.display_name || c.profiles.username}
                      </Link>
                      {c.body}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-0.5">{timeAgo(c.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-4 mb-3">
              <button
                onClick={toggleLike}
                disabled={savingLike}
                className={`transition-colors ${liked ? 'text-red-400' : 'text-white hover:text-red-400'}`}
              >
                <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
              </button>
              <button className="text-white hover:text-teal-400 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/feed?post=${post.id}`);
                }}
                className="text-white hover:text-teal-400 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
            {likesCount > 0 && (
              <p className="text-sm font-semibold text-white mb-1">{likesCount.toLocaleString()} like{likesCount !== 1 ? 's' : ''}</p>
            )}

            {/* Comment input */}
            <form onSubmit={submitComment} className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                maxLength={1000}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-600 focus:outline-none"
              />
              <button
                type="submit"
                disabled={sendingComment || !commentText.trim()}
                className="text-teal-400 hover:text-teal-300 disabled:text-gray-700 transition-colors"
              >
                {sendingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
