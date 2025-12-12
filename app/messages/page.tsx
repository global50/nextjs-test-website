'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { mockMessages } from '@/lib/mockData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function MessagesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);

  const filteredMessages = mockMessages.filter((msg) =>
    msg.senderName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Messages</h1>
        <p className="text-muted-foreground">Your conversations</p>
      </div>

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-2">
        {filteredMessages.length === 0 ? (
          <Card className="p-12 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No messages found</p>
          </Card>
        ) : (
          filteredMessages.map((message) => (
            <Card
              key={message.id}
              className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                selectedMessage === message.id ? 'ring-2 ring-blue-500' : ''
              } ${message.unread ? 'bg-blue-50/50' : ''}`}
              onClick={() => setSelectedMessage(message.id)}
            >
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={message.senderAvatar || undefined} />
                  <AvatarFallback>
                    {message.senderName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-medium ${message.unread ? 'font-semibold' : ''}`}>
                      {message.senderName}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${message.unread ? 'text-gray-900' : 'text-muted-foreground'}`}>
                    {message.preview}
                  </p>
                </div>
                {message.unread && (
                  <div className="w-2.5 h-2.5 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </MainLayout>
  );
}
