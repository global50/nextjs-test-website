'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, MessageCircle, Bell, Settings, Users, LogOut, Briefcase, Building2, Bookmark, PanelLeftClose, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { currentUser } from '@/lib/mockData';
import { useSidebar } from '@/contexts/SidebarContext';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

const navItems = [
  { href: '/feed', label: 'Feed', icon: Home },
  { href: '/explore', label: 'People', icon: Users },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/companies', label: 'Companies', icon: Building2 },
  { href: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, profile, loading, signOut } = useAuth();
  const { isOpen, toggle, close } = useSidebar();

  const displayUser = user && profile ? {
    username: profile.username,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
  } : currentUser;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={close}
        />
      )}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background transition-transform duration-300',
          !isOpen && '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b px-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">Social</span>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={toggle}
                className="h-8 w-8 p-0"
              >
                <PanelLeftClose className="h-5 w-5" />
              </Button>
            </div>
          </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                    : 'text-foreground hover:bg-accent'
                )}
              >
                <item.icon className={cn('h-5 w-5', isActive ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground')} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4">
          {loading ? (
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
              </div>
            </div>
          ) : user ? (
            <div className="space-y-2">
              <Link
                href={`/profile/${displayUser.username}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={displayUser.avatar_url || undefined} />
                  <AvatarFallback>{getInitials(displayUser.full_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{displayUser.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">@{displayUser.username}</p>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <AuthModal defaultView="login">
                <Button variant="outline" className="w-full">
                  Sign in
                </Button>
              </AuthModal>
              <AuthModal defaultView="signup">
                <Button className="w-full">
                  Sign up
                </Button>
              </AuthModal>
            </div>
          )}
        </div>
      </div>
    </aside>
    </>
  );
}
