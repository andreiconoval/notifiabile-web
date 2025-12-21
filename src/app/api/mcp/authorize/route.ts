import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * MCP Authorization API
 *
 * POST /api/mcp/authorize
 *
 * Creates an authorization code for MCP client
 * The authorization code is valid for 10 minutes
 * After exchange, it becomes an access token valid for 1 hour
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { client_id, redirect_uri, scopes, user_id } = body;

    // Validate required fields
    if (!client_id || !redirect_uri || !user_id) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    );

    // Verify MCP client exists and redirect_uri matches
    const { data: clientData, error: clientError } = await supabase
      .from('mcp_clients')
      .select('*')
      .eq('client_id', client_id)
      .single();

    if (clientError || !clientData) {
      return NextResponse.json({ error: 'Invalid client' }, { status: 400 });
    }

    // Validate redirect_uri matches registered URI
    if (clientData.redirect_uri !== redirect_uri) {
      return NextResponse.json({ error: 'Invalid redirect URI' }, { status: 400 });
    }

    // Generate authorization code
    const authorizationCode = crypto.randomBytes(20).toString('hex');

    // Store authorization in database (valid for 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const { error: insertError } = await supabase.from('mcp_authorizations').insert({
      client_id,
      user_id,
      authorization_code: authorizationCode,
      redirect_uri,
      scopes: scopes || ['openid', 'profile', 'email'],
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      console.error('Failed to store authorization:', insertError);
      return NextResponse.json({ error: 'Failed to create authorization' }, { status: 500 });
    }

    return NextResponse.json({
      authorization_code: authorizationCode,
      expires_in: 600, // 10 minutes
    });
  } catch (error) {
    console.error('MCP authorization error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
