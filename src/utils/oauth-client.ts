'use client';

/**
 * Supabase OAuth client utilities
 */

/**
 * Initiate OAuth flow by redirecting to Supabase OAuth endpoint
 *
 * @param supabaseUrl - Your Supabase project URL
 * @param provider - OAuth provider ('google', 'github', 'azure', etc.)
 * @param redirectUri - Where to redirect after approval
 */
export function initiateSupabaseOAuth(
  supabaseUrl: string,
  provider: string = 'google',
  redirectUri: string,
) {
  if (!supabaseUrl || !redirectUri) {
    throw new Error('Missing Supabase URL or redirect URI');
  }

  // Redirect to Supabase OAuth endpoint
  const authUrl = new URL(`${supabaseUrl}/auth/v1/authorize`);
  authUrl.searchParams.append('provider', provider);
  authUrl.searchParams.append('redirect_to', redirectUri);

  window.location.href = authUrl.toString();
}

/**
 * Hook to handle OAuth authorization code callback.
 * Extracts code, error, and state from URL parameters.
 *
 * Usage in callback component:
 * const { code, error, isProcessing } = useOAuthCallback();
 */
export function useOAuthCallback() {
  // Using dynamic import to avoid SSR issues
  if (typeof window === 'undefined') {
    return {
      code: null,
      error: null,
      errorDescription: null,
      isProcessing: false,
    };
  }

  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const error = params.get('error');
  const errorDescription = params.get('error_description');

  return {
    code,
    error,
    errorDescription,
    isProcessing: !!code,
  };
}

/**
 * Exchange authorization code for session
 * Call this from your backend API route
 */
export async function exchangeCodeForSession(
  code: string,
  apiUrl: string = process.env.NEXT_PUBLIC_API_URL || '',
) {
  const response = await fetch(`${apiUrl}/api/auth/oauth/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to exchange code for session');
  }

  return response.json();
}
