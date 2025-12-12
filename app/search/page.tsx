'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PostCard } from '@/components/posts/PostCard';
import { UserCard } from '@/components/users/UserCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Loader2, TrendingUp, Hash } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { mockPosts, mockUsers, MockPost, MockUser } from '@/lib/mockData';

type Hashtag = {
  id: string;
  name: string;
  usage_count: number;
};

export default function SearchPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState<MockPost[]>([]);
  const [users, setUsers] = useState<MockUser[]>([]);
  const [trendingTags, setTrendingTags] = useState<Hashtag[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    loadTrendingTags();
  }, []);

  const loadTrendingTags = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('hashtags')
        .select('*')
        .order('usage_count', { ascending: false })
        .limit(10);
      setTrendingTags(data || []);
    } catch (error) {
      console.error('Error loading trending tags:', error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    if (user) {
      await searchReal();
    } else {
      searchMock();
    }
    setLoading(false);
  };

  const searchReal = async () => {
    try {
      const [postsResult, usersResult] = await Promise.all([
        supabase
          .from('posts')
          .select(`*, profiles:user_id (username, full_name, avatar_url), likes (count), comments (count)`)
          .ilike('content', `%${query}%`)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('profiles')
          .select('*')
          .or(`full_name.ilike.%${query}%,username.ilike.%${query}%,headline.ilike.%${query}%`)
          .limit(20),
      ]);

      const formattedPosts: MockPost[] = (postsResult.data || []).map((post) => ({
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
        isLiked: false,
      }));

      const formattedUsers: MockUser[] = (usersResult.data || []).map((u) => ({
        id: u.id,
        username: u.username,
        full_name: u.full_name,
        avatar_url: u.avatar_url,
        bio: u.bio,
        created_at: u.created_at,
        _count: { followers: 0, following: 0, posts: 0 },
        isFollowing: false,
      }));

      setPosts(formattedPosts);
      setUsers(formattedUsers);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const searchMock = () => {
    const lowerQuery = query.toLowerCase();
    const filteredPosts = mockPosts.filter((p) =>
      p.content.toLowerCase().includes(lowerQuery)
    );
    const filteredUsers = mockUsers.filter(
      (u) =>
        u.full_name.toLowerCase().includes(lowerQuery) ||
        u.username.toLowerCase().includes(lowerQuery)
    );
    setPosts(filteredPosts);
    setUsers(filteredUsers);
  };

  const handleTagClick = (tag: string) => {
    setQuery(`#${tag}`);
    setActiveTab('posts');
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

  const handleFollow = async (userId: string) => {
    if (!user) return;
    await supabase.from('follows').insert({ follower_id: user.id, following_id: userId });
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, isFollowing: true, _count: { ...u._count, followers: u._count.followers + 1 } }
          : u
      )
    );
  };

  const handleUnfollow = async (userId: string) => {
    if (!user) return;
    await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', userId);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, isFollowing: false, _count: { ...u._count, followers: u._count.followers - 1 } }
          : u
      )
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Search</h1>
          <p className="text-muted-foreground mb-6">Find posts, people, and topics</p>

          <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search posts, people, or #hashtags..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </Button>
          </form>
        </div>

        {trendingTags.length > 0 && !searched && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <h2 className="font-semibold">Trending Topics</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingTags.map((tag) => (
                  <Button
                    key={tag.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleTagClick(tag.name)}
                    className="gap-1"
                  >
                    <Hash className="h-3 w-3" />
                    {tag.name}
                    <span className="text-muted-foreground text-xs">({tag.usage_count})</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {searched && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="posts">
                Posts ({posts.length})
              </TabsTrigger>
              <TabsTrigger value="people">
                People ({users.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-4 mt-4">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No posts found for "{query}"</p>
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={handleLike}
                    onUnlike={handleUnlike}
                    currentUserId={user?.id}
                    isAuthenticated={!!user}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="people" className="mt-4">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No people found for "{query}"</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {users.map((u) => (
                    <UserCard
                      key={u.id}
                      user={u}
                      onFollow={handleFollow}
                      onUnfollow={handleUnfollow}
                      isAuthenticated={!!user}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </MainLayout>
  );
}
