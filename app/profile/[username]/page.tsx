'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { PostCard } from '@/components/posts/PostCard';
import { mockProfiles, mockPosts, currentUser, MockPost } from '@/lib/mockData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { AuthModal } from '@/components/auth/AuthModal';

type ProfileData = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string;
};

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { user, profile: authProfile } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<MockPost[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    bio: '',
    avatar_url: '',
  });

  const isOwnProfile = user && authProfile && authProfile.username === username;
  const isMockProfile = !user || username === currentUser.username || mockProfiles.some(p => p.username === username);

  useEffect(() => {
    if (user) {
      loadRealProfile();
    } else {
      loadMockProfile();
    }
  }, [username, user]);

  const loadMockProfile = () => {
    setLoading(true);
    let mockProfile: ProfileData | null = null;

    if (username === currentUser.username) {
      mockProfile = currentUser;
    } else {
      const found = mockProfiles.find((p) => p.username === username);
      if (found) {
        mockProfile = found;
      }
    }

    if (mockProfile) {
      setProfile(mockProfile);
      const userPosts = mockPosts.filter((p) => p.profiles.username === username);
      setPosts(userPosts);
      setFollowerCount(Math.floor(Math.random() * 1000) + 100);
      setFollowingCount(Math.floor(Math.random() * 500) + 50);
      setEditForm({
        full_name: mockProfile.full_name,
        bio: mockProfile.bio || '',
        avatar_url: mockProfile.avatar_url || '',
      });
    } else {
      setProfile(null);
    }
    setLoading(false);
  };

  const loadRealProfile = async () => {
    setLoading(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profileData) {
        loadMockProfile();
        return;
      }

      setProfile(profileData);
      setEditForm({
        full_name: profileData.full_name,
        bio: profileData.bio || '',
        avatar_url: profileData.avatar_url || '',
      });

      const [
        { data: userPosts },
        { count: followers },
        { count: following },
        { data: followCheck },
      ] = await Promise.all([
        supabase
          .from('posts')
          .select(`*, profiles:user_id (username, full_name, avatar_url), likes (count), comments (count)`)
          .eq('user_id', profileData.id)
          .order('created_at', { ascending: false }),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profileData.id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profileData.id),
        user ? supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', profileData.id) : { data: [] },
      ]);

      const { data: userLikes } = user
        ? await supabase.from('likes').select('post_id').eq('user_id', user.id)
        : { data: [] };

      const likedPostIds = new Set(userLikes?.map((l) => l.post_id) || []);

      const formattedPosts: MockPost[] = (userPosts || []).map((post) => ({
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
      setFollowerCount(followers || 0);
      setFollowingCount(following || 0);
      setIsFollowing(!!(followCheck && followCheck.length > 0));
    } catch (error) {
      console.error('Error loading profile:', error);
      loadMockProfile();
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!user || !profile) return;

    if (isFollowing) {
      setIsFollowing(false);
      setFollowerCount((prev) => prev - 1);
      try {
        await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', profile.id);
      } catch (error) {
        setIsFollowing(true);
        setFollowerCount((prev) => prev + 1);
      }
    } else {
      setIsFollowing(true);
      setFollowerCount((prev) => prev + 1);
      try {
        await supabase.from('follows').insert({ follower_id: user.id, following_id: profile.id });
      } catch (error) {
        setIsFollowing(false);
        setFollowerCount((prev) => prev - 1);
      }
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          bio: editForm.bio,
          avatar_url: editForm.avatar_url || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile((prev) => prev ? { ...prev, ...editForm } : null);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
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
      if (postToDelete) setPosts((prev) => [postToDelete, ...prev]);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </MainLayout>
    );
  }

  if (!profile) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">User not found</p>
        </div>
      </MainLayout>
    );
  }

  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <MainLayout>
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-32 w-32">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold">{profile.full_name}</h1>
                  <p className="text-muted-foreground">@{profile.username}</p>
                </div>
                {isOwnProfile ? (
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Edit Profile</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div>
                          <Label htmlFor="full_name">Full Name</Label>
                          <Input
                            id="full_name"
                            value={editForm.full_name}
                            onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            value={editForm.bio}
                            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label htmlFor="avatar_url">Avatar URL</Label>
                          <Input
                            id="avatar_url"
                            type="url"
                            value={editForm.avatar_url}
                            onChange={(e) => setEditForm({ ...editForm, avatar_url: e.target.value })}
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={saving}>
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                ) : user ? (
                  <Button onClick={handleFollowToggle} variant={isFollowing ? 'outline' : 'default'}>
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </Button>
                ) : (
                  <AuthModal defaultView="signup">
                    <Button>Follow</Button>
                  </AuthModal>
                )}
              </div>
              {profile.bio && <p className="text-gray-700 mb-4">{profile.bio}</p>}
              <div className="flex gap-6">
                <div>
                  <span className="font-semibold">{posts.length}</span>
                  <span className="text-muted-foreground ml-1">posts</span>
                </div>
                <div>
                  <span className="font-semibold">{followerCount}</span>
                  <span className="text-muted-foreground ml-1">followers</span>
                </div>
                <div>
                  <span className="font-semibold">{followingCount}</span>
                  <span className="text-muted-foreground ml-1">following</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="posts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="posts">Posts</TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No posts yet</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onUnlike={handleUnlike}
                onDelete={handleDelete}
                currentUserId={user?.id || currentUser.id}
                isAuthenticated={!!user}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
