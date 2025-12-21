'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

function ErrorMessage({ message }: { message: string }) {
  return (
    <main className="max-w-2xl mx-auto py-12 px-6">
      <h1 className="text-2xl font-semibold mb-2">Authorization Error</h1>
      <p className="text-sm text-muted-foreground">{message}</p>
    </main>
  );
}

function LoadingMessage() {
  return (
    <main className="max-w-2xl mx-auto py-12 px-6">
      <h1 className="text-2xl font-semibold mb-2">Loading...</h1>
      <p className="text-sm text-muted-foreground">
        Please wait while we verify your authorization request.
      </p>
    </main>
  );
}

export default function ConsentPage() {
  const {
    user,
    accessToken,
    hydrated,
    getAuthorizationDetails,
    approveAuthorization,
    denyAuthorization,
  } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const authorizationId = searchParams.get('authorization_id');

  const [authorizationDetails, setAuthorizationDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check auth and fetch authorization details
  useEffect(() => {
    if (!hydrated) return;

    // Redirect if not authenticated
    if (!user || !accessToken) {
      const redirectPath = `/oauth/consent?authorization_id=${encodeURIComponent(authorizationId || '')}`;
      router.push(`/auth?redirect=${encodeURIComponent(redirectPath)}`);
      return;
    }

    if (!authorizationId) {
      setError('Missing authorization_id');
      setLoading(false);
      return;
    }

    // Fetch authorization details
    const fetchDetails = async () => {
      try {
        const details = await getAuthorizationDetails(authorizationId);
        if (!details) {
          setError('Unable to load the authorization request. Please try again.');
        } else {
          setAuthorizationDetails(details.data);
        }
      } catch (err) {
        setError(
          (err as Error).message || 'An error occurred while loading authorization details.',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [hydrated, user, accessToken, authorizationId, router, getAuthorizationDetails]);

  async function handleApprove() {
    if (!authorizationId) return;
    setIsSubmitting(true);
    try {
      const response = await approveAuthorization(authorizationId);
      if (response?.data?.redirect_url) {
        window.location.href = response?.data?.redirect_url || '';
      } else {
        setError('Failed to approve authorization. Please try again.');
      }
    } catch (err) {
      setError((err as Error).message || 'An error occurred while approving authorization.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeny() {
    if (!authorizationId) return;
    setIsSubmitting(true);
    try {
      const redirectUrl = await denyAuthorization(authorizationId);
      if (redirectUrl?.data?.redirect_url) {
        window.location.href = redirectUrl?.data?.redirect_url || '';
      } else {
        setError('Failed to deny authorization. Please try again.');
      }
    } catch (err) {
      setError((err as Error).message || 'An error occurred while denying authorization.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!hydrated || loading) {
    return <LoadingMessage />;
  }

  if (error || !authorizationDetails) {
    return <ErrorMessage message={error || 'Unable to load authorization details'} />;
  }

  return (
    <main className="max-w-2xl mx-auto py-12 px-6 space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">Supabase Authorization</p>
        <h1 className="text-2xl font-semibold">This application is requesting access</h1>
        <p className="text-sm text-muted-foreground">
          Redirect URI: {authorizationDetails.redirect_uri || 'Not provided'}
        </p>
      </header>

      <section className="space-y-3 rounded-lg border p-4">
        <div>
          <p className="text-sm font-medium">Application</p>
          <p className="text-sm text-muted-foreground">OAuth Client</p>
        </div>
        <div>
          <p className="text-sm font-medium">Redirect URI</p>
          <p className="text-sm text-muted-foreground">
            {authorizationDetails.redirect_uri || 'Not provided'}
          </p>
        </div>
        {authorizationDetails.scope?.length ? (
          <div>
            <p className="text-sm font-medium mb-1">Requested permissions</p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              {authorizationDetails.scope.split(' ').map((scope: string) => (
                <li key={scope}>{scope}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <div className="flex items-center gap-3">
        <button
          onClick={handleApprove}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Processing...' : 'Approve'}
        </button>
        <button
          onClick={handleDeny}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Processing...' : 'Deny'}
        </button>
      </div>
    </main>
  );
}
