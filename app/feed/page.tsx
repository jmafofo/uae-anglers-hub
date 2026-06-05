'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import PostCard, { type PostItem } from '@/components/posts/PostCard';
import CreatePostModal from '@/components/posts/CreatePostModal';
import { getSupabase } from '@/lib/supabase';

export default function FeedPage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const sb = getSupabase();

    // Check auth immediately (same pattern as Navbar)
    sb.auth.getUser().then(({ data: { user } }) => {
      setIsAuth(!!user);
    });

    // Listen to auth state changes
    const { data: listener } = sb.auth.onAuthStateChange((_event, session) => {
      setIsAuth(!!session?.user);
    });

    loadPosts();

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function loadPosts() {
    setLoading(true);
    try {
      const res = await fetch('/api/posts?feed=following&limit=12');
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0f1a]">
      <div className="max-w-xl mx-auto py-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 mb-4">
          <h1 className="text-xl font-bold text-white">Feed</h1>
          {isAuth && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
            >
              <Plus className="w-4 h-4" /> New Post
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-6 h-6 text-teal-400 animate-spin mx-auto" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 px-4">
            <p className="text-gray-500 text-lg mb-2">Your feed is empty</p>
            <p className="text-gray-600 text-sm mb-6">Follow other anglers to see their posts here.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="/community"
                className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-colors"
              >
                Explore Community
              </a>
              {isAuth && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="inline-flex items-center gap-2 border border-white/20 hover:border-teal-500/50 text-gray-300 hover:text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-colors"
                >
                  <Plus className="w-4 h-4" /> Create Post
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreatePostModal onClose={() => setShowCreate(false)} onCreated={loadPosts} />
      )}
    </main>
  );
}
