import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * OAuth Callback Handler - Supabase
 *
 * This API route exchanges the authorization code for a session
 * using Supabase's auth service.
 *
 * Flow:
 * 1. Frontend receives ?code=XXX from Supabase
 * 2. Frontend calls this API with the code
 * 3. This route exchanges code for session using Supabase
 * 4. Session tokens are set in cookies
 * 5. Frontend is redirected to dashboard
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
    }

    // Create Supabase client using service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    );

    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data?.session) {
      console.error('Token exchange failed:', error?.message);
      return NextResponse.json(
        { error: error?.message || 'Failed to exchange code for token' },
        { status: 400 },
      );
    }

    // Create response and set secure cookies with session tokens
    const response = NextResponse.json(
      {
        success: true,
        message: 'Authentication successful',
      },
      { status: 200 },
    );

    // Store access token in httpOnly cookie (more secure than localStorage)
    response.cookies.set({
      name: 'access_token',
      value: data.session.access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
    });

    // Store refresh token in httpOnly cookie
    if (data.session.refresh_token) {
      response.cookies.set({
        name: 'refresh_token',
        value: data.session.refresh_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
    }

    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
