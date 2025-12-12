'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { UserCard } from '@/components/users/UserCard';
import { supabase, Profile } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function ExplorePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadUsers();
    }
  }, [user]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);

      const { data: usersData, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const usersWithFollowStatus = await Promise.all(
        (usersData || []).map(async (userProfile) => {
          const [followersResult, followingResult, isFollowingResult] = await Promise.all([
            supabase
              .from('follows')
              .select('id', { count: 'exact', head: true })
              .eq('following_id', userProfile.id),
            supabase
              .from('follows')
              .select('id', { count: 'exact', head: true })
              .eq('follower_id', userProfile.id),
            supabase
              .from('follows')
              .select('id')
              .eq('follower_id', user?.id)
              .eq('following_id', userProfile.id)
              .maybeSingle(),
          ]);

          return {
            ...userProfile,
            _count: {
              followers: followersResult.count || 0,
              following: followingResult.count || 0,
            },
            isFollowing: !!isFollowingResult.data,
          };
        })
      );

      setUsers(usersWithFollowStatus);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      const { error } = await supabase.from('follows').insert([
        {
          follower_id: user?.id,
          following_id: userId,
        },
      ]);

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, isFollowing: true, _count: { ...u._count, followers: u._count.followers + 1 } }
            : u
        )
      );
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user?.id)
        .eq('following_id', userId);

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, isFollowing: false, _count: { ...u._count, followers: u._count.followers - 1 } }
            : u
        )
      );
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Discover People</h1>
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

        {loadingUsers ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery ? 'No users found matching your search' : 'No users to discover yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
                showFollowButton={true}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
