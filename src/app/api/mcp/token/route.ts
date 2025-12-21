import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * Simple JWT encoding (you can replace with jsonwebtoken package if preferred)
 */
function encodeJWT(payload: any, secret: string): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');

  const message = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac('sha256', secret).update(message).digest('base64url');

  return `${message}.${signature}`;
}

/**
 * MCP Token Exchange API
 *
 * POST /api/mcp/token
 *
 * Exchanges authorization code for access token
 * This is called by the MCP client after user approves
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { grant_type, code, client_id, client_secret, redirect_uri } = body;

    // Validate grant type
    if (grant_type !== 'authorization_code') {
      return NextResponse.json({ error: 'unsupported_grant_type' }, { status: 400 });
    }

    // Validate required fields
    if (!code || !client_id || !client_secret || !redirect_uri) {
      return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    );

    // Verify client credentials
    const { data: clientData, error: clientError } = await supabase
      .from('mcp_clients')
      .select('*')
      .eq('client_id', client_id)
      .single();

    if (clientError || !clientData) {
      return NextResponse.json({ error: 'invalid_client' }, { status: 400 });
    }

    // Verify client secret
    if (clientData.client_secret !== client_secret) {
      return NextResponse.json({ error: 'invalid_client' }, { status: 400 });
    }

    // Verify redirect_uri matches
    if (clientData.redirect_uri !== redirect_uri) {
      return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
    }

    // Look up authorization
    const { data: authData, error: authError } = await supabase
      .from('mcp_authorizations')
      .select('*')
      .eq('authorization_code', code)
      .eq('client_id', client_id)
      .single();

    if (authError || !authData) {
      return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
    }

    // Check if authorization is expired
    if (new Date() > new Date(authData.expires_at)) {
      return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
    }

    // Get user info
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
      authData.user_id,
    );

    if (userError || !userData.user) {
      return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
    }

    // Generate access token (JWT)
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const now = Math.floor(Date.now() / 1000);

    const accessToken = encodeJWT(
      {
        sub: authData.user_id,
        email: userData.user.email,
        client_id,
        scopes: authData.scopes,
        type: 'mcp_access_token',
        iat: now,
        exp: now + 3600, // 1 hour
      },
      jwtSecret,
    );

    // Generate refresh token
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Store refresh token (valid for 30 days)
    const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const { error: refreshError } = await supabase.from('mcp_refresh_tokens').insert({
      client_id,
      user_id: authData.user_id,
      token_hash: refreshTokenHash,
      expires_at: refreshExpiresAt.toISOString(),
    });

    if (refreshError) {
      console.error('Failed to store refresh token:', refreshError);
      // Continue anyway, but without refresh token
    }

    // Mark authorization as used
    await supabase
      .from('mcp_authorizations')
      .update({ used_at: new Date().toISOString() })
      .eq('id', authData.id);

    return NextResponse.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 3600, // 1 hour
      scope: authData.scopes.join(' '),
    });
  } catch (error) {
    console.error('MCP token error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
