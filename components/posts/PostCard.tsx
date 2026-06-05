'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Share2, Send, Bookmark, Loader2 } from 'lucide-react';
import ImageCarousel from './ImageCarousel';
import { getAuthHeaders } from '@/lib/supabase';

export interface PostItem {
  id: string;
  caption: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  has_liked: boolean;
  media: { media_url: string; media_type: string }[];
  profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface PostCardProps {
  post: PostItem;
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

export default function PostCard({ post }: PostCardProps) {
  const [liked, setLiked] = useState(post.has_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [saved, setSaved] = useState(false);
  const [savingLike, setSavingLike] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<{ id: string; body: string; created_at: string; profiles: { username: string; display_name: string | null; avatar_url: string | null } }[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    // Track view once
    fetch(`/api/posts/${post.id}/view`, { method: 'POST' }).catch(() => {});
  }, [post.id]);

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

  async function loadComments() {
    if (showComments) {
      setShowComments(false);
      return;
    }
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments ?? []);
        setShowComments(true);
      }
    } catch {
      // ignore
    } finally {
      setLoadingComments(false);
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
    <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 sm:p-4">
        <Link href={`/profile/${post.profile.username}`}>
          <div className="w-9 h-9 rounded-full bg-teal-500/20 flex items-center justify-center text-sm font-bold text-teal-400 overflow-hidden">
            {post.profile.avatar_url ? (
              <img src={post.profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              displayName[0]?.toUpperCase()
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${post.profile.username}`} className="text-sm font-semibold text-white hover:text-teal-400 transition-colors truncate">
            {displayName}
          </Link>
          <p className="text-[11px] text-gray-500">{timeAgo(post.created_at)}</p>
        </div>
      </div>

      {/* Media */}
      <ImageCarousel media={post.media} />

      {/* Actions */}
      <div className="px-3 sm:px-4 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleLike}
              disabled={savingLike}
              className={`transition-colors ${liked ? 'text-red-400' : 'text-white hover:text-red-400'}`}
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={loadComments}
              className="text-white hover:text-teal-400 transition-colors"
            >
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
          <button
            onClick={() => setSaved((s) => !s)}
            className={`transition-colors ${saved ? 'text-amber-400' : 'text-white hover:text-amber-400'}`}
          >
            <Bookmark className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {likesCount > 0 && (
          <p className="text-sm font-semibold text-white mt-2">{likesCount.toLocaleString()} like{likesCount !== 1 ? 's' : ''}</p>
        )}

        {/* Caption */}
        {post.caption && (
          <p className="text-sm text-gray-300 mt-2">
            <Link href={`/profile/${post.profile.username}`} className="font-semibold text-white hover:text-teal-400 transition-colors mr-1">
              {displayName}
            </Link>
            {post.caption}
          </p>
        )}

        {/* Comments toggle */}
        {post.comments_count > 0 && !showComments && (
          <button
            onClick={loadComments}
            className="text-sm text-gray-500 hover:text-gray-400 mt-2 transition-colors"
          >
            View all {post.comments_count} comment{post.comments_count !== 1 ? 's' : ''}
          </button>
        )}

        {/* Comments section */}
        {showComments && (
          <div className="mt-3 space-y-2">
            {loadingComments ? (
              <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex gap-2 text-sm">
                  <Link href={`/profile/${c.profiles.username}`} className="font-semibold text-white hover:text-teal-400 transition-colors shrink-0">
                    {c.profiles.display_name || c.profiles.username}
                  </Link>
                  <span className="text-gray-300">{c.body}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Comment input */}
        <form onSubmit={submitComment} className="flex items-center gap-2 mt-3 pb-3">
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
  );
}
