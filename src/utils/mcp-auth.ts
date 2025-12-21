/**
 * MCP (Model Context Protocol) Authentication Utilities
 *
 * Handles OAuth flow for MCP clients connecting to this Next.js app.
 * Flow:
 * 1. MCP client initiates auth → redirects user to browser
 * 2. User logs in with Supabase
 * 3. Consent screen shows MCP client requesting access
 * 4. User approves → generates authorization code
 * 5. MCP client receives code and exchanges for token
 * 6. MCP client uses token for all subsequent API calls
 * 7. API middleware validates token and sets user context
 */

import crypto from 'crypto';

/**
 * Generate secure authorization code for MCP client
 */
export function generateAuthorizationCode(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate secure PKCE code verifier and challenge
 * Used for enhanced security in MCP OAuth flow
 */
export function generatePKCE() {
  const verifier = crypto.randomBytes(32).toString('hex');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');

  return { verifier, challenge };
}

/**
 * Generate state parameter for CSRF protection
 */
export function generateState(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * MCP Client Configuration
 */
export interface MCPClientConfig {
  clientId: string;
  clientName: string;
  redirectUri: string;
  scopes: string[];
  description?: string;
  logoUrl?: string;
}

/**
 * MCP Authorization Session
 */
export interface MCPAuthSession {
  authorizationCode: string;
  clientId: string;
  userId: string;
  scopes: string[];
  issuedAt: Date;
  expiresAt: Date;
  refreshToken?: string;
}

/**
 * MCP Access Token
 */
export interface MCPAccessToken {
  accessToken: string;
  refreshToken?: string;
  tokenType: 'Bearer';
  expiresIn: number;
  scope: string;
  userId: string;
  clientId: string;
}

/**
 * Build MCP authorization URL
 * MCP client opens this in browser to start auth flow
 */
export function buildMCPAuthUrl(
  baseUrl: string,
  clientId: string,
  redirectUri: string,
  scopes: string[] = ['openid', 'profile', 'email'],
  state?: string,
): string {
  const authUrl = new URL(`${baseUrl}/auth/mcp/authorize`);
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('scope', scopes.join(' '));
  authUrl.searchParams.append('response_type', 'code');

  if (state) {
    authUrl.searchParams.append('state', state);
  }

  return authUrl.toString();
}

/**
 * Generate MCP login URL for MCP client to use
 * This is what the MCP client will call to initiate the flow
 */
export function generateMCPLoginUrl(
  appUrl: string,
  clientId: string,
  redirectUri: string,
  clientName: string,
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'openid profile email',
    response_type: 'code',
    client_name: clientName,
  });

  return `${appUrl}/auth/mcp/authorize?${params.toString()}`;
}
