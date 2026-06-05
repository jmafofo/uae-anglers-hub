'use client';

import PostGrid from './PostGrid';
import type { PostItem } from './PostCard';

interface PostGridWrapperProps {
  posts: PostItem[];
  emptyMessage?: string;
}

export default function PostGridWrapper({ posts, emptyMessage }: PostGridWrapperProps) {
  return <PostGrid posts={posts} emptyMessage={emptyMessage} />;
}
