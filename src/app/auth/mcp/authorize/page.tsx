'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Loader2, Shield } from 'lucide-react';

/**
 * MCP Authorization Page
 *
 * Flow:
 * 1. MCP client redirects user here with client_id and redirect_uri
 * 2. User logs in with Supabase (if not already)
 * 3. Consent screen shows what client is requesting
 * 4. User approves or denies
 * 5. Redirects back to MCP client with authorization code
 */
export default function MCPAuthorizePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const clientId = searchParams?.get('client_id');
  const redirectUri = searchParams?.get('redirect_uri');
  const scopes = searchParams?.get('scope')?.split(' ') || ['openid', 'profile', 'email'];
  const state = searchParams?.get('state');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientInfo, setClientInfo] = useState<any>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      // Preserve MCP params in redirect
      const params = new URLSearchParams({
        client_id: clientId || '',
        redirect_uri: redirectUri || '',
        scope: scopes.join(' '),
        ...(state && { state }),
      });
      router.push(`/auth?mcp=true&${params.toString()}`);
    }
  }, [user, authLoading, clientId, redirectUri, scopes, state, router]);

  // Load client info from backend
  useEffect(() => {
    if (clientId && user) {
      loadClientInfo();
    }
  }, [clientId, user]);

  async function loadClientInfo() {
    try {
      const response = await fetch(`/api/mcp/client/${clientId}`);
      if (!response.ok) {
        throw new Error('Client not found');
      }
      const data = await response.json();
      setClientInfo(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load client info');
    }
  }

  async function handleApprove() {
    if (!clientId || !redirectUri || !user) {
      setError('Missing required parameters');
      return;
    }

    setLoading(true);
    try {
      // Call backend to create authorization
      const response = await fetch('/api/mcp/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          redirect_uri: redirectUri,
          scopes,
          user_id: user.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Authorization failed');
      }

      const { authorization_code } = await response.json();

      // Redirect back to MCP client with code
      const redirectUrl = new URL(redirectUri);
      redirectUrl.searchParams.append('code', authorization_code);
      if (state) {
        redirectUrl.searchParams.append('state', state);
      }

      toast.success('Authorization approved! Redirecting...');
      window.location.href = redirectUrl.toString();
    } catch (err: any) {
      const errorMsg = err.message || 'Authorization failed';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeny() {
    if (!redirectUri) {
      setError('Missing redirect URI');
      return;
    }

    try {
      // Redirect back with error
      const redirectUrl = new URL(redirectUri);
      redirectUrl.searchParams.append('error', 'access_denied');
      redirectUrl.searchParams.append('error_description', 'User denied authorization');
      if (state) {
        redirectUrl.searchParams.append('state', state);
      }

      window.location.href = redirectUrl.toString();
    } catch (err) {
      setError('Failed to redirect');
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Authorization Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-900">{error}</p>
            </div>
            <Button variant="outline" className="w-full" onClick={() => router.push('/auth')}>
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-6 w-6 text-indigo-600" />
            <div>
              <CardTitle>Application Authorization</CardTitle>
              <CardDescription>MCP Client Request</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Client Info */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h3 className="font-semibold text-indigo-900 mb-1">
              {clientInfo?.name || 'MCP Client'}
            </h3>
            {clientInfo?.description && (
              <p className="text-sm text-indigo-800 mb-3">{clientInfo.description}</p>
            )}
            {clientInfo?.logo_url && (
              <img
                src={clientInfo.logo_url}
                alt={clientInfo.name}
                className="h-12 w-12 rounded-lg"
              />
            )}
          </div>

          {/* User Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">Logged in as:</p>
            <p className="font-semibold text-gray-900">{user?.email}</p>
          </div>

          {/* Scopes */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-3">
              This app is requesting access to:
            </p>
            <ul className="space-y-2">
              {scopes.map((scope) => (
                <li key={scope} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                  <span className="capitalize">{scope.replace('_', ' ')}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-900">
              You are about to grant access to your account. Make sure you trust this application.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleDeny} disabled={loading}>
              Deny
            </Button>
            <Button
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              onClick={handleApprove}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Approve & Connect
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
