'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { UserCard } from '@/components/users/UserCard';
import { mockUsers, MockUser } from '@/lib/mockData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { AuthModal } from '@/components/auth/AuthModal';

export default function ExplorePage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<MockUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadRealUsers();
    } else {
      setUsers(mockUsers);
      setLoading(false);
    }
  }, [user]);

  const loadRealUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user!.id);

      const followingIds = new Set(following?.map((f) => f.following_id) || []);

      const usersWithCounts = await Promise.all(
        (profiles || []).map(async (profile) => {
          const [{ count: followersCount }, { count: followingCount }, { count: postsCount }] = await Promise.all([
            supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
            supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
            supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', profile.id),
          ]);

          return {
            id: profile.id,
            username: profile.username,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            bio: profile.bio,
            created_at: profile.created_at,
            _count: {
              followers: followersCount || 0,
              following: followingCount || 0,
              posts: postsCount || 0,
            },
            isFollowing: followingIds.has(profile.id),
          };
        })
      );

      setUsers(usersWithCounts);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers(mockUsers);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    if (!user) return;

    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, isFollowing: true, _count: { ...u._count, followers: u._count.followers + 1 } }
          : u
      )
    );

    try {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: userId });
    } catch (error) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, isFollowing: false, _count: { ...u._count, followers: u._count.followers - 1 } }
            : u
        )
      );
    }
  };

  const handleUnfollow = async (userId: string) => {
    if (!user) return;

    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, isFollowing: false, _count: { ...u._count, followers: u._count.followers - 1 } }
          : u
      )
    );

    try {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', userId);
    } catch (error) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, isFollowing: true, _count: { ...u._count, followers: u._count.followers + 1 } }
            : u
        )
      );
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Discover People!</h1>
        <p className="text-muted-foreground mb-6">Find and connect with new people</p>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {!user && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center mb-6">
          <p className="text-sm text-blue-800 mb-2">
            Sign up to follow people and build your network!
          </p>
          <AuthModal defaultView="signup">
            <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
              Create an account
            </Button>
          </AuthModal>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery ? 'No users found matching your search' : 'No users to discover yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredUsers.map((u) => (
            <UserCard
              key={u.id}
              user={u}
              onFollow={handleFollow}
              onUnfollow={handleUnfollow}
              showFollowButton={true}
              isAuthenticated={!!user}
            />
          ))}
        </div>
      )}
    </MainLayout>
  );
}
