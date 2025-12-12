'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { mockNotifications } from '@/lib/mockData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Heart, MessageCircle, UserPlus, AtSign, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const notificationIcons = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  mention: AtSign,
};

const notificationColors = {
  like: 'text-red-500 bg-red-50',
  comment: 'text-blue-500 bg-blue-50',
  follow: 'text-green-500 bg-green-50',
  mention: 'text-amber-500 bg-amber-50',
};

export default function NotificationsPage() {
  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  return (
    <MainLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Notifications</h1>
            <p className="text-muted-foreground">Stay updated with your activity</p>
          </div>
          {unreadCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
              {unreadCount} new
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {mockNotifications.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
          </Card>
        ) : (
          mockNotifications.map((notification) => {
            const Icon = notificationIcons[notification.type];
            const colorClass = notificationColors[notification.type];

            return (
              <Card
                key={notification.id}
                className={`p-4 transition-colors hover:bg-gray-50 ${
                  !notification.read ? 'bg-blue-50/30' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={notification.actorAvatar || undefined} />
                      <AvatarFallback>
                        {notification.actorName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute -bottom-1 -right-1 p-1 rounded-full ${colorClass}`}
                    >
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
          })
        )}
      </div>
    </MainLayout>
  );
}
