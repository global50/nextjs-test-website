'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { mockNotifications } from '@/lib/mockData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, UserPlus, AtSign, Bell, Loader2, Check, Briefcase } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

type Notification = {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'job_application';
  actorName: string;
  actorUsername: string;
  actorAvatar: string | null;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
};

const notificationIcons: Record<string, typeof Heart> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  mention: AtSign,
  job_application: Briefcase,
};

const notificationColors: Record<string, string> = {
  like: 'text-red-500 bg-red-50',
  comment: 'text-blue-500 bg-blue-50',
  follow: 'text-green-500 bg-green-50',
  mention: 'text-amber-500 bg-amber-50',
  job_application: 'text-purple-500 bg-purple-50',
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadNotifications();
    } else {
      const mapped: Notification[] = mockNotifications.map((n) => ({
        ...n,
        actorUsername: n.actorName.toLowerCase().replace(/\s+/g, ''),
      }));
      setNotifications(mapped);
      setLoading(false);
    }
  }, [user]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const generatedNotifications: Notification[] = [];

      const [likesResult, commentsResult, followsResult] = await Promise.all([
        supabase
          .from('likes')
          .select(`
            id,
            created_at,
            post_id,
            profiles:user_id (username, full_name, avatar_url),
            posts:post_id (user_id, content)
          `)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('comments')
          .select(`
            id,
            created_at,
            post_id,
            content,
            profiles:user_id (username, full_name, avatar_url),
            posts:post_id (user_id)
          `)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('follows')
          .select(`
            follower_id,
            created_at,
            profiles:follower_id (username, full_name, avatar_url)
          `)
          .eq('following_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      (likesResult.data || []).forEach((like: any) => {
        if (like.posts?.user_id === user!.id && like.profiles) {
          generatedNotifications.push({
            id: `like-${like.id}`,
            type: 'like',
            actorName: like.profiles.full_name,
            actorUsername: like.profiles.username,
            actorAvatar: like.profiles.avatar_url,
            message: 'liked your post',
            timestamp: like.created_at,
            read: false,
            link: `/post/${like.post_id}`,
          });
        }
      });

      (commentsResult.data || []).forEach((comment: any) => {
        if (comment.posts?.user_id === user!.id && comment.profiles) {
          generatedNotifications.push({
            id: `comment-${comment.id}`,
            type: 'comment',
            actorName: comment.profiles.full_name,
            actorUsername: comment.profiles.username,
            actorAvatar: comment.profiles.avatar_url,
            message: `commented: "${comment.content.slice(0, 50)}${comment.content.length > 50 ? '...' : ''}"`,
            timestamp: comment.created_at,
            read: false,
            link: `/post/${comment.post_id}`,
          });
        }
      });

      (followsResult.data || []).forEach((follow: any) => {
        if (follow.profiles) {
          generatedNotifications.push({
            id: `follow-${follow.follower_id}-${follow.created_at}`,
            type: 'follow',
            actorName: follow.profiles.full_name,
            actorUsername: follow.profiles.username,
            actorAvatar: follow.profiles.avatar_url,
            message: 'started following you',
            timestamp: follow.created_at,
            read: false,
            link: `/profile/${follow.profiles.username}`,
          });
        }
      });

      generatedNotifications.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      const fallbackMapped: Notification[] = mockNotifications.map((n) => ({
        ...n,
        actorUsername: n.actorName.toLowerCase().replace(/\s+/g, ''),
      }));
      setNotifications(generatedNotifications.length > 0 ? generatedNotifications : fallbackMapped);
    } catch (error) {
      console.error('Error loading notifications:', error);
      const fallbackMapped: Notification[] = mockNotifications.map((n) => ({
        ...n,
        actorUsername: n.actorName.toLowerCase().replace(/\s+/g, ''),
      }));
      setNotifications(fallbackMapped);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

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
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Notifications</h1>
            <p className="text-muted-foreground">Stay updated with your activity</p>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                  {unreadCount} new
                </span>
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <Check className="h-4 w-4 mr-2" />
                  Mark all read
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : notifications.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
          </Card>
        ) : (
          notifications.map((notification) => {
            const Icon = notificationIcons[notification.type] || Bell;
            const colorClass = notificationColors[notification.type] || 'text-gray-500 bg-gray-50';

            const content = (
              <Card
                className={`p-4 transition-colors hover:bg-gray-50 cursor-pointer ${
                  !notification.read ? 'bg-blue-50/30' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={notification.actorAvatar || undefined} />
                      <AvatarFallback>{getInitials(notification.actorName)}</AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 p-1 rounded-full ${colorClass}`}>
                      <Icon className="h-3 w-3" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-semibold">{notification.actorName}</span>{' '}
                      <span className="text-muted-foreground">{notification.message}</span>
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  {!notification.read && (
                    <div className="w-2.5 h-2.5 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                  )}
                </div>
              </Card>
            );

            if (notification.link) {
              return (
                <Link key={notification.id} href={notification.link}>
                  {content}
                </Link>
              );
            }

            return <div key={notification.id}>{content}</div>;
          })
        )}
      </div>
    </MainLayout>
  );
}
