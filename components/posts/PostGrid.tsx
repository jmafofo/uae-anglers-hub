'use client';

import { useState } from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import PostDetailModal from './PostDetailModal';
import type { PostItem } from './PostCard';

interface PostGridProps {
  posts: PostItem[];
  emptyMessage?: string;
}

export default function PostGrid({ posts, emptyMessage = 'No posts yet' }: PostGridProps) {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const selectedPost = posts.find((p) => p.id === selectedPostId);

  if (posts.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-1 sm:gap-2">
        {posts.map((post) => (
          <button
            key={post.id}
            onClick={() => setSelectedPostId(post.id)}
            className="relative aspect-square group overflow-hidden rounded-lg bg-white/5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.media[0]?.media_url}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="flex items-center gap-1 text-white text-sm font-semibold">
                <Heart className="w-4 h-4 fill-current" /> {post.likes_count}
              </span>
              <span className="flex items-center gap-1 text-white text-sm font-semibold">
                <MessageCircle className="w-4 h-4 fill-current" /> {post.comments_count}
              </span>
            </div>
            {/* Multiple media indicator */}
            {post.media.length > 1 && (
              <div className="absolute top-2 right-2 text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <rect x="7" y="7" width="18" height="18" rx="2" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPostId(null)}
        />
      )}
    </>
  );
}
