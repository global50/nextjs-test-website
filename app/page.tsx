'use client';

import { useState, useEffect } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';

export default function Home() {
  const [showLogin, setShowLogin] = useState(true);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push('/feed');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="flex-1 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
              <div className="p-3 bg-blue-600 rounded-xl">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-5xl font-bold text-gray-900">Social</h1>
            </div>
            <p className="text-2xl text-gray-600 mb-4">
              Connect with friends and share your moments
            </p>
            <p className="text-lg text-gray-500 max-w-xl">
              Join our community to share posts, connect with others, and discover amazing content from people around the world.
            </p>
          </div>
          <div className="flex-1 w-full max-w-md">
            {showLogin ? (
              <LoginForm onToggle={() => setShowLogin(false)} />
            ) : (
              <SignUpForm onToggle={() => setShowLogin(true)} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
