'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PostCard } from '@/components/posts/PostCard';
import { Button } from '@/components/ui/button';
import { Bookmark, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { AuthModal } from '@/components/auth/AuthModal';
import { MockPost } from '@/lib/mockData';

export default function BookmarksPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<MockPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadBookmarks();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadBookmarks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select(`
          post_id,
          posts:post_id (
            id,
            user_id,
            content,
            image_url,
            created_at,
            profiles:user_id (username, full_name, avatar_url),
            likes (count),
            comments (count)
          )
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const { data: userLikes } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', user!.id);

      const likedPostIds = new Set(userLikes?.map((l) => l.post_id) || []);

      const formattedPosts: MockPost[] = (data || [])
        .filter((b) => b.posts)
        .map((b) => {
          const post = b.posts as any;
          return {
            id: post.id,
            user_id: post.user_id,
            content: post.content,
            image_url: post.image_url,
            created_at: post.created_at,
            profiles: post.profiles,
            _count: {
              likes: post.likes?.[0]?.count || 0,
              comments: post.comments?.[0]?.count || 0,
            },
            isLiked: likedPostIds.has(post.id),
          };
        });

      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, isLiked: true, _count: { ...p._count, likes: p._count.likes + 1 } }
          : p
      )
    );
  };

  const handleUnlike = async (postId: string) => {
    if (!user) return;
    await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, isLiked: false, _count: { ...p._count, likes: p._count.likes - 1 } }
          : p
      )
    );
  };

  const handleRemoveBookmark = async (postId: string) => {
    if (!user) return;
    await supabase.from('bookmarks').delete().eq('post_id', postId).eq('user_id', user.id);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <Bookmark className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Save posts for later</h2>
          <p className="text-muted-foreground mb-4">
            Sign in to bookmark posts and access them anytime.
          </p>
          <AuthModal defaultView="signup">
            <Button>Sign up</Button>
          </AuthModal>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Bookmarks</h1>
          <p className="text-muted-foreground">Posts you've saved for later</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-lg font-medium mb-2">No bookmarks yet</h2>
            <p className="text-muted-foreground">
              Save posts by clicking the bookmark icon on any post.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onUnlike={handleUnlike}
                onDelete={handleRemoveBookmark}
                currentUserId={user.id}
                isAuthenticated={true}
                isBookmarked={true}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
