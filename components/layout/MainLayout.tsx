'use client';

import { Sidebar } from './Sidebar';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const { isOpen, toggle } = useSidebar();

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className={cn('transition-all duration-300', isOpen ? 'pl-64' : 'pl-0')}>
        {!isOpen && (
          <div className="fixed top-4 left-4 z-20">
            <Button
              onClick={toggle}
              size="sm"
              className="h-10 w-10 p-0 shadow-lg"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        )}
        <div className="container mx-auto px-6 py-8 max-w-4xl">
          {children}
        </div>
      </main>
    </div>
  );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </SidebarProvider>
  );
}
