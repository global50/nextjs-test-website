'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PostCard } from '@/components/posts/PostCard';
import { mockPosts, currentUser, MockPost } from '@/lib/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ImageIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { AuthModal } from '@/components/auth/AuthModal';

export default function FeedPage() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<MockPost[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [creating, setCreating] = useState(false);

  const displayUser = user && profile ? {
    id: profile.id,
    username: profile.username,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
  } : currentUser;

  useEffect(() => {
    if (user) {
      loadRealPosts();
    } else {
      setPosts(mockPosts);
      setLoadingPosts(false);
    }
  }, [user]);

  const loadRealPosts = async () => {
    setLoadingPosts(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (username, full_name, avatar_url),
          likes (count),
          comments (count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const { data: userLikes } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', user!.id);

      const likedPostIds = new Set(userLikes?.map((l) => l.post_id) || []);

      const formattedPosts: MockPost[] = (data || []).map((post) => ({
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
      }));

      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts(mockPosts);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, isLiked: true, _count: { ...p._count, likes: p._count.likes + 1 } }
          : p
      )
    );

    try {
      await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
    } catch (error) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, isLiked: false, _count: { ...p._count, likes: p._count.likes - 1 } }
            : p
        )
      );
    }
  };

  const handleUnlike = async (postId: string) => {
    if (!user) return;

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, isLiked: false, _count: { ...p._count, likes: p._count.likes - 1 } }
          : p
      )
    );

    try {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
    } catch (error) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, isLiked: true, _count: { ...p._count, likes: p._count.likes + 1 } }
            : p
        )
      );
    }
  };

  const handleDelete = async (postId: string) => {
    if (!user) return;

    const postToDelete = posts.find((p) => p.id === postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));

    try {
      await supabase.from('posts').delete().eq('id', postId).eq('user_id', user.id);
    } catch (error) {
      if (postToDelete) {
        setPosts((prev) => [postToDelete, ...prev]);
      }
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() || !user) return;

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({ user_id: user.id, content: newPost.trim() })
        .select(`*, profiles:user_id (username, full_name, avatar_url)`)
        .single();

      if (error) throw error;

      const post: MockPost = {
        id: data.id,
        user_id: data.user_id,
        content: data.content,
        image_url: data.image_url,
        created_at: data.created_at,
        profiles: data.profiles,
        _count: { likes: 0, comments: 0 },
        isLiked: false,
      };

      setPosts([post, ...posts]);
      setNewPost('');
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setCreating(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={displayUser.avatar_url || undefined} />
                <AvatarFallback>{getInitials(displayUser.full_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder={user ? "What's on your mind?" : "Sign in to share your thoughts..."}
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="min-h-[80px] resize-none"
                  disabled={!user}
                />
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" className="text-muted-foreground" disabled={!user}>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Photo
                  </Button>
                  {user ? (
                    <Button onClick={handleCreatePost} disabled={!newPost.trim() || creating}>
                      {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post'}
                    </Button>
                  ) : (
                    <AuthModal defaultView="signup">
                      <Button>Sign up to post</Button>
                    </AuthModal>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {!user && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-800 mb-2">
              You're viewing demo content. Sign up to create posts and interact with others!
            </p>
            <AuthModal defaultView="signup">
              <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                Create an account
              </Button>
            </AuthModal>
          </div>
        )}

        {loadingPosts ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onUnlike={handleUnlike}
              onDelete={handleDelete}
              currentUserId={displayUser.id}
              isAuthenticated={!!user}
            />
          ))
        )}
      </div>
    </MainLayout>
  );
}
