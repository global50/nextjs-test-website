'use client';

import { useState } from 'react';
import { MockPost } from '@/lib/mockData';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Heart, MessageCircle, Trash2, Bookmark, Share2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { AuthModal } from '@/components/auth/AuthModal';
import { CommentSection } from './CommentSection';
import { supabase } from '@/lib/supabase';

type PostCardProps = {
  post: MockPost;
  onLike?: (postId: string) => Promise<void>;
  onUnlike?: (postId: string) => Promise<void>;
  onDelete?: (postId: string) => Promise<void>;
  currentUserId?: string;
  isAuthenticated?: boolean;
  isBookmarked?: boolean;
};

export function PostCard({ post, onLike, onUnlike, onDelete, currentUserId, isAuthenticated = true, isBookmarked: initialBookmarked = false }: PostCardProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [liked, setLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post._count?.likes || 0);
  const [commentCount, setCommentCount] = useState(post._count?.comments || 0);
  const [showComments, setShowComments] = useState(false);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [bookmarking, setBookmarking] = useState(false);

  const initials = post.profiles?.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  const handleLikeToggle = async () => {
    if (!isAuthenticated || isLiking) return;
    setIsLiking(true);

    try {
      if (liked) {
        await onUnlike?.(post.id);
        setLiked(false);
        setLikeCount((prev) => prev - 1);
      } else {
        await onLike?.(post.id);
        setLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting || !onDelete) return;
    if (!confirm('Are you sure you want to delete this post?')) return;

    setIsDeleting(true);
    try {
      await onDelete(post.id);
    } catch (error) {
      console.error('Error deleting post:', error);
      setIsDeleting(false);
    }
  };

  const handleBookmarkToggle = async () => {
    if (!isAuthenticated || !currentUserId || bookmarking) return;
    setBookmarking(true);

    try {
      if (bookmarked) {
        await supabase.from('bookmarks').delete().eq('post_id', post.id).eq('user_id', currentUserId);
        setBookmarked(false);
      } else {
        await supabase.from('bookmarks').insert({ post_id: post.id, user_id: currentUserId });
        setBookmarked(true);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    } finally {
      setBookmarking(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.profiles?.full_name}`,
          text: post.content.slice(0, 100),
          url: window.location.origin + `/post/${post.id}`,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.origin + `/post/${post.id}`);
    }
  };

  const canDelete = currentUserId && post.user_id === currentUserId;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Link
            href={`/profile/${post.profiles?.username}`}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Avatar>
              <AvatarImage src={post.profiles?.avatar_url || undefined} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{post.profiles?.full_name}</p>
              <p className="text-xs text-muted-foreground">
                @{post.profiles?.username} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </Link>
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm whitespace-pre-wrap">{post.content}</p>
        {post.image_url && (
          <div className="rounded-lg overflow-hidden border">
            <img
              src={post.image_url}
              alt="Post image"
              className="w-full h-auto object-cover max-h-96"
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-3 pt-2">
        <div className="flex items-center justify-between w-full">
          <div className="flex gap-1">
            {isAuthenticated ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLikeToggle}
                disabled={isLiking}
                className={`gap-2 ${liked ? 'text-red-600' : ''}`}
              >
                <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                <span>{likeCount}</span>
              </Button>
            ) : (
              <AuthModal defaultView="login">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Heart className="h-4 w-4" />
                  <span>{likeCount}</span>
                </Button>
              </AuthModal>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="h-4 w-4" />
              <span>{commentCount}</span>
              {showComments ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          {isAuthenticated ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBookmarkToggle}
              disabled={bookmarking}
              className={bookmarked ? 'text-blue-600' : ''}
            >
              <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} />
            </Button>
          ) : (
            <AuthModal defaultView="login">
              <Button variant="ghost" size="sm">
                <Bookmark className="h-4 w-4" />
              </Button>
            </AuthModal>
          )}
        </div>

        {showComments && (
          <div className="w-full border-t pt-3">
            <CommentSection
              postId={post.id}
              isAuthenticated={isAuthenticated}
              currentUserId={currentUserId}
            />
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
