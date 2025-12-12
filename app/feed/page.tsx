'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PostCard } from '@/components/posts/PostCard';
import { mockPosts, currentUser, MockPost } from '@/lib/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ImageIcon } from 'lucide-react';

export default function FeedPage() {
  const [posts, setPosts] = useState<MockPost[]>(mockPosts);
  const [newPost, setNewPost] = useState('');

  const handleLike = async (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, isLiked: true, _count: { ...p._count, likes: p._count.likes + 1 } }
          : p
      )
    );
  };

  const handleUnlike = async (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, isLiked: false, _count: { ...p._count, likes: p._count.likes - 1 } }
          : p
      )
    );
  };

  const handleDelete = async (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleCreatePost = () => {
    if (!newPost.trim()) return;

    const post: MockPost = {
      id: `post-${Date.now()}`,
      user_id: currentUser.id,
      content: newPost,
      image_url: null,
      created_at: new Date().toISOString(),
      profiles: {
        username: currentUser.username,
        full_name: currentUser.full_name,
        avatar_url: currentUser.avatar_url,
      },
      _count: { likes: 0, comments: 0 },
      isLiked: false,
    };

    setPosts([post, ...posts]);
    setNewPost('');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={currentUser.avatar_url || undefined} />
                <AvatarFallback>
                  {currentUser.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="What's on your mind?"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Photo
                  </Button>
                  <Button onClick={handleCreatePost} disabled={!newPost.trim()}>
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {posts.length === 0 ? (
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
              currentUserId={currentUser.id}
            />
          ))
        )}
      </div>
    </MainLayout>
  );
}
