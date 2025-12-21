'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { initiateSupabaseOAuth } from '@/utils/oauth-client';
import { LogIn } from 'lucide-react';

interface OAuthLoginButtonProps {
  provider?: 'google' | 'github' | 'azure';
  children?: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  onError?: (error: Error) => void;
}

/**
 * Supabase OAuth Login Button Component
 *
 * Initiates OAuth flow by redirecting to Supabase OAuth endpoint.
 *
 * Usage:
 * ```tsx
 * <OAuthLoginButton provider="google">
 *   Login with Google
 * </OAuthLoginButton>
 * ```
 */
export function OAuthLoginButton({
  provider = 'google',
  children = 'Login with Supabase',
  variant = 'default',
  size = 'default',
  className,
  onError,
}: OAuthLoginButtonProps) {
  const handleClick = () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const redirectUri = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI;

      if (!supabaseUrl || !redirectUri) {
        const error = new Error(
          'Supabase is not configured. Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_OAUTH_REDIRECT_URI',
        );
        onError?.(error);
        console.error(error);
        return;
      }

      initiateSupabaseOAuth(supabaseUrl, provider, redirectUri);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(err);
      console.error('Supabase OAuth login error:', err);
    }
  };

  return (
    <Button onClick={handleClick} variant={variant} size={size} className={className}>
      <LogIn className="h-4 w-4 mr-2" />
      {children}
    </Button>
  );
}
