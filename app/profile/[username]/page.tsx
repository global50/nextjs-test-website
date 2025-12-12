'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { PostCard } from '@/components/posts/PostCard';
import { supabase, Profile } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ProfilePage() {
  const { user, profile: currentUserProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', bio: '', avatar_url: '' });

  const isOwnProfile = currentUserProfile?.username === username;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && username) {
      loadProfile();
    }
  }, [user, username]);

  const loadProfile = async () => {
    try {
      setLoading(true);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profileData) {
        router.push('/feed');
        return;
      }

      setProfile(profileData);
      setEditForm({
        full_name: profileData.full_name,
        bio: profileData.bio || '',
        avatar_url: profileData.avatar_url || '',
      });

      const [postsResult, followersResult, followingResult, isFollowingResult] = await Promise.all([
        supabase
          .from('posts')
          .select(`*, profiles:user_id (username, full_name, avatar_url)`)
          .eq('user_id', profileData.id)
          .order('created_at', { ascending: false }),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', profileData.id),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', profileData.id),
        supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user?.id)
          .eq('following_id', profileData.id)
          .maybeSingle(),
      ]);

      if (postsResult.data) {
        const postsWithCounts = await Promise.all(
          postsResult.data.map(async (post) => {
            const [likesResult, commentsResult, userLikeResult] = await Promise.all([
              supabase.from('likes').select('id', { count: 'exact', head: true }).eq('post_id', post.id),
              supabase.from('comments').select('id', { count: 'exact', head: true }).eq('post_id', post.id),
              supabase.from('likes').select('id').eq('post_id', post.id).eq('user_id', user?.id).maybeSingle(),
            ]);

            return {
              ...post,
              _count: {
                likes: likesResult.count || 0,
                comments: commentsResult.count || 0,
              },
              isLiked: !!userLikeResult.data,
            };
          })
        );
        setPosts(postsWithCounts);
      }

      setFollowerCount(followersResult.count || 0);
      setFollowingCount(followingResult.count || 0);
      setIsFollowing(!!isFollowingResult.data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!profile) return;

    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user?.id)
          .eq('following_id', profile.id);
        setIsFollowing(false);
        setFollowerCount((prev) => prev - 1);
      } else {
        await supabase.from('follows').insert([
          {
            follower_id: user?.id,
            following_id: profile.id,
          },
        ]);
        setIsFollowing(true);
        setFollowerCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          bio: editForm.bio,
          avatar_url: editForm.avatar_url || null,
        })
        .eq('id', profile.id);

      if (error) throw error;

      setIsEditDialogOpen(false);
      loadProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const { error } = await supabase.from('likes').insert([{ post_id: postId, user_id: user?.id }]);
      if (error) throw error;
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  };

  const handleUnlike = async (postId: string) => {
    try {
      const { error } = await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user?.id);
      if (error) throw error;
    } catch (error) {
      console.error('Error unliking post:', error);
      throw error;
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!profile) return null;

  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
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
                          <Button type="submit" className="w-full">Save Changes</Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Button onClick={handleFollowToggle} variant={isFollowing ? 'outline' : 'default'}>
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </Button>
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
                  currentUserId={user?.id}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
