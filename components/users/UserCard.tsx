'use client';

import { MockUser } from '@/lib/mockData';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AuthModal } from '@/components/auth/AuthModal';

type UserCardProps = {
  user: MockUser;
  onFollow?: (userId: string) => Promise<void>;
  onUnfollow?: (userId: string) => Promise<void>;
  showFollowButton?: boolean;
  isAuthenticated?: boolean;
};

export function UserCard({ user, onFollow, onUnfollow, showFollowButton = true, isAuthenticated = true }: UserCardProps) {
  const initials = user.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleFollowToggle = async () => {
    if (!isAuthenticated) return;
    if (user.isFollowing) {
      await onUnfollow?.(user.id);
    } else {
      await onFollow?.(user.id);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Link href={`/profile/${user.username}`} className="flex flex-col items-center text-center">
          <Avatar className="h-20 w-20 mb-3">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <h3 className="font-semibold text-lg">{user.full_name}</h3>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
          {user.bio && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{user.bio}</p>
          )}
          <div className="flex gap-4 mt-3 text-sm">
            <div>
              <span className="font-semibold">{user._count?.followers || 0}</span>
              <span className="text-muted-foreground ml-1">followers</span>
            </div>
            <div>
              <span className="font-semibold">{user._count?.following || 0}</span>
              <span className="text-muted-foreground ml-1">following</span>
            </div>
          </div>
        </Link>
      </CardContent>
      {showFollowButton && (
        <CardFooter>
          {isAuthenticated ? (
            <Button
              onClick={handleFollowToggle}
              variant={user.isFollowing ? 'outline' : 'default'}
              className="w-full"
            >
              {user.isFollowing ? 'Unfollow' : 'Follow'}
            </Button>
          ) : (
            <AuthModal defaultView="signup">
              <Button className="w-full">Follow</Button>
            </AuthModal>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
