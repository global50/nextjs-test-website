export type MockProfile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string;
  created_at: string;
};

export type MockPost = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
  _count: {
    likes: number;
    comments: number;
  };
  isLiked: boolean;
};

export type MockUser = MockProfile & {
  _count: {
    followers: number;
    following: number;
  };
  isFollowing: boolean;
};

export type MockMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  preview: string;
  timestamp: string;
  unread: boolean;
};

export type MockNotification = {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention';
  actorName: string;
  actorAvatar: string | null;
  message: string;
  timestamp: string;
  read: boolean;
};

export const mockProfiles: MockProfile[] = [
  {
    id: '1',
    username: 'sarahchen',
    full_name: 'Sarah Chen',
    avatar_url: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
    bio: 'Product designer at heart. Coffee enthusiast. Creating beautiful experiences one pixel at a time.',
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    username: 'marcusj',
    full_name: 'Marcus Johnson',
    avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
    bio: 'Software engineer & open source contributor. Building the future of web.',
    created_at: '2024-01-20T14:30:00Z',
  },
  {
    id: '3',
    username: 'emilydavis',
    full_name: 'Emily Davis',
    avatar_url: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150',
    bio: 'Travel photographer capturing moments around the world. Adventure seeker.',
    created_at: '2024-02-01T08:15:00Z',
  },
  {
    id: '4',
    username: 'alexkim',
    full_name: 'Alex Kim',
    avatar_url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150',
    bio: 'Startup founder. Tech optimist. Building products that matter.',
    created_at: '2024-02-10T12:00:00Z',
  },
  {
    id: '5',
    username: 'jessicawu',
    full_name: 'Jessica Wu',
    avatar_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
    bio: 'UX researcher & writer. Making tech more human.',
    created_at: '2024-02-15T16:45:00Z',
  },
  {
    id: '6',
    username: 'davidmiller',
    full_name: 'David Miller',
    avatar_url: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150',
    bio: 'Full-stack developer. Coffee addict. Building cool things on the internet.',
    created_at: '2024-02-20T09:30:00Z',
  },
];

export const mockPosts: MockPost[] = [
  {
    id: 'post-1',
    user_id: '1',
    content: 'Just shipped a new design system for our product! Really proud of how the components turned out. The attention to detail in micro-interactions makes all the difference.',
    image_url: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    profiles: {
      username: 'sarahchen',
      full_name: 'Sarah Chen',
      avatar_url: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
    },
    _count: { likes: 42, comments: 8 },
    isLiked: false,
  },
  {
    id: 'post-2',
    user_id: '2',
    content: 'Been working on optimizing our API response times. Managed to reduce latency by 60% through better caching strategies and query optimization. Performance matters!',
    image_url: null,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    profiles: {
      username: 'marcusj',
      full_name: 'Marcus Johnson',
      avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
    },
    _count: { likes: 28, comments: 12 },
    isLiked: true,
  },
  {
    id: 'post-3',
    user_id: '3',
    content: 'Golden hour in Santorini. Sometimes you just have to stop and appreciate the beauty around you.',
    image_url: 'https://images.pexels.com/photos/1010657/pexels-photo-1010657.jpeg?auto=compress&cs=tinysrgb&w=800',
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    profiles: {
      username: 'emilydavis',
      full_name: 'Emily Davis',
      avatar_url: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150',
    },
    _count: { likes: 156, comments: 24 },
    isLiked: false,
  },
  {
    id: 'post-4',
    user_id: '4',
    content: 'Excited to announce that we just closed our Series A! Thanks to everyone who believed in our vision. The journey is just beginning.',
    image_url: null,
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    profiles: {
      username: 'alexkim',
      full_name: 'Alex Kim',
      avatar_url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150',
    },
    _count: { likes: 89, comments: 31 },
    isLiked: true,
  },
  {
    id: 'post-5',
    user_id: '5',
    content: 'User research tip: Always ask "why" at least 3 times. You will be surprised how much deeper insights you can uncover by simply being curious.',
    image_url: null,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    profiles: {
      username: 'jessicawu',
      full_name: 'Jessica Wu',
      avatar_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
    },
    _count: { likes: 67, comments: 15 },
    isLiked: false,
  },
  {
    id: 'post-6',
    user_id: '6',
    content: 'Just discovered this amazing coffee shop with the best workspace setup. Good coffee + fast wifi = productivity heaven.',
    image_url: 'https://images.pexels.com/photos/1024248/pexels-photo-1024248.jpeg?auto=compress&cs=tinysrgb&w=800',
    created_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    profiles: {
      username: 'davidmiller',
      full_name: 'David Miller',
      avatar_url: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150',
    },
    _count: { likes: 34, comments: 7 },
    isLiked: false,
  },
];

export const mockUsers: MockUser[] = mockProfiles.map((profile, index) => ({
  ...profile,
  _count: {
    followers: Math.floor(Math.random() * 5000) + 100,
    following: Math.floor(Math.random() * 500) + 50,
  },
  isFollowing: index % 2 === 0,
}));

export const mockMessages: MockMessage[] = [
  {
    id: 'msg-1',
    senderId: '1',
    senderName: 'Sarah Chen',
    senderAvatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
    preview: 'Hey! Love your latest project. Would you be interested in collaborating?',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    unread: true,
  },
  {
    id: 'msg-2',
    senderId: '2',
    senderName: 'Marcus Johnson',
    senderAvatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
    preview: 'Thanks for the code review feedback!',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    unread: true,
  },
  {
    id: 'msg-3',
    senderId: '3',
    senderName: 'Emily Davis',
    senderAvatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150',
    preview: 'The photos from the event are ready!',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    unread: false,
  },
  {
    id: 'msg-4',
    senderId: '4',
    senderName: 'Alex Kim',
    senderAvatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150',
    preview: 'Let me know when you are free for a call',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    unread: false,
  },
];

export const mockNotifications: MockNotification[] = [
  {
    id: 'notif-1',
    type: 'like',
    actorName: 'Sarah Chen',
    actorAvatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
    message: 'liked your post about design systems',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: 'notif-2',
    type: 'follow',
    actorName: 'Marcus Johnson',
    actorAvatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
    message: 'started following you',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: 'notif-3',
    type: 'comment',
    actorName: 'Emily Davis',
    actorAvatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150',
    message: 'commented on your photo: "This is amazing!"',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: 'notif-4',
    type: 'mention',
    actorName: 'Alex Kim',
    actorAvatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150',
    message: 'mentioned you in a post',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: 'notif-5',
    type: 'like',
    actorName: 'Jessica Wu',
    actorAvatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
    message: 'liked your comment',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
];

export const currentUser: MockProfile = {
  id: 'current-user',
  username: 'johndoe',
  full_name: 'John Doe',
  avatar_url: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150',
  bio: 'Welcome to Social! This is a demo account.',
  created_at: '2024-01-01T00:00:00Z',
};
