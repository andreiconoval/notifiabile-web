'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export function ClientGuard({ children }: { children: React.ReactNode }) {
  const { accessToken, hydrated } = useAuth();

  const router = useRouter();
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/auth');

  useEffect(() => {
    if (!hydrated) return; // wait until zustand has loaded from localStorage
    if (isAuthPage) return; // never redirect from the auth page
    if (!accessToken) {
      router.replace(`/auth?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [hydrated, isAuthPage, accessToken, router, pathname]);

  // While hydrating, or when unauthenticated (and redirecting), render nothing or a skeleton
  if (!hydrated) return null;
  if (!accessToken && !isAuthPage) return null;

  return <>{children}</>;
}
