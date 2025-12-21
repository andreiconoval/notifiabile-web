'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOAuthCallback, exchangeCodeForSession } from '@/utils/oauth-client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Supabase OAuth Callback Page
 *
 * This page receives the authorization code from Supabase after the user
 * approves the OAuth consent screen.
 *
 * Flow:
 * 1. User clicks "Login with Supabase"
 * 2. Gets redirected to Supabase OAuth screen
 * 3. User approves → browser redirects to this page with ?code=...
 * 4. This page exchanges code for session
 * 5. Stores session tokens and logs user in
 *
 * Usage:
 * - Mount this at your configured redirect_uri (e.g., http://localhost:3000/oauth/callback)
 * - Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
export default function OAuthCallbackPage() {
  const router = useRouter();
  const { code, error, errorDescription } = useOAuthCallback();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (error) {
      setMessage(`Authorization failed: ${errorDescription || error}`);
      toast.error(`OAuth Error: ${error}`);
      return;
    }

    if (code) {
      handleCallback();
    }
  }, [code, error]);

  async function handleCallback() {
    if (!code) return;

    setLoading(true);

    try {
      setMessage('Exchanging code for session...');

      // Call backend API to exchange code for session
      const response = await exchangeCodeForSession(code);

      setMessage('✓ Login successful! Redirecting...');
      toast.success('You have been logged in');

      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err: any) {
      const errorMsg = err.message || 'Authentication failed';
      setMessage(`✗ ${errorMsg}`);
      toast.error(errorMsg);
      console.error('OAuth callback error:', err);

      // Show retry button
      setLoading(false);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authorization Failed</CardTitle>
            <CardDescription>Something went wrong during authentication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-900">
                <strong>Error:</strong> {error}
              </p>
              {errorDescription && <p className="text-sm text-red-800 mt-2">{errorDescription}</p>}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => (window.location.href = '/')}
              >
                Go Home
              </Button>
              <Button className="flex-1" onClick={() => (window.location.href = '/auth')}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Completing Sign In</CardTitle>
          <CardDescription>
            {loading
              ? 'Please wait while we verify your authorization...'
              : 'Processing your login...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
              <p className="text-sm text-gray-600">{message}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {message && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-900">{message}</p>
                </div>
              )}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => (window.location.href = '/')}
                >
                  Go Home
                </Button>
                <Button className="flex-1" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 text-center border-t pt-4">
            {code && <p>Code received: {code.substring(0, 10)}...</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
