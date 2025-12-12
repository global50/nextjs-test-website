'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { LoginForm } from './LoginForm';
import { SignUpForm } from './SignUpForm';

type AuthModalProps = {
  children: React.ReactNode;
  defaultView?: 'login' | 'signup';
};

export function AuthModal({ children, defaultView = 'login' }: AuthModalProps) {
  const [view, setView] = useState<'login' | 'signup'>(defaultView);
  const [open, setOpen] = useState(false);

  const handleToggle = () => {
    setView(view === 'login' ? 'signup' : 'login');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md p-0 gap-0 border-0 bg-transparent shadow-none">
        {view === 'login' ? (
          <LoginForm onToggle={handleToggle} onSuccess={() => setOpen(false)} />
        ) : (
          <SignUpForm onToggle={handleToggle} onSuccess={() => setOpen(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
