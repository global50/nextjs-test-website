'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { UserCard } from '@/components/users/UserCard';
import { mockUsers, MockUser } from '@/lib/mockData';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function ExplorePage() {
  const [users, setUsers] = useState<MockUser[]>(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');

  const handleFollow = async (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, isFollowing: true, _count: { ...u._count, followers: u._count.followers + 1 } }
          : u
      )
    );
  };

  const handleUnfollow = async (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, isFollowing: false, _count: { ...u._count, followers: u._count.followers - 1 } }
          : u
      )
    );
  };

  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
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

      {filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery ? 'No users found matching your search' : 'No users to discover yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
    </MainLayout>
  );
}
