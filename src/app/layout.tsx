'use client';
import './globals.css';

import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

import { Toaster } from '../components/ui/sonner';
import { useRouter, usePathname } from 'next/navigation';
import Providers from './providers';

function AppContent({ children }: { children?: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only redirect to /auth if user is not authenticated AND not on public routes
    const isPublicRoute = pathname.startsWith('/auth') || pathname.startsWith('/oauth');
    if (!loading && !user && !isPublicRoute) {
      router.push('/auth');
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <>
      {children}
      <Toaster position="top-right" />
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AuthProvider>
            <AppContent children={children} />
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
