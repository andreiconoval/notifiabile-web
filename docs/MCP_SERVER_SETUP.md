# MCP Server Authentication Implementation

**Status**: ✅ Complete  
**Date**: December 1, 2025  
**Framework**: Next.js 16 + React 19 + Supabase

## Overview

This implementation enables MCP (Model Context Protocol) clients to securely authenticate with your Next.js application. The flow uses OAuth 2.0 Authorization Code Grant to ensure:

- ✅ User approval before granting access
- ✅ Secure token exchange
- ✅ Scoped access control
- ✅ Audit logging
- ✅ Token refresh capability

## Architecture

```
MCP Client              Your Next.js App               Supabase             Your .NET API
    |                        |                           |                        |
    |--1. Open Browser------->|                           |                        |
    |     /auth/mcp/authorize |                           |                        |
    |                        |                           |                        |
    |<------2. Auth Page------|                           |                        |
    |     (user logs in)      |                           |                        |
    |                        |--3. Verify Session------->|                        |
    |                        |<--4. Session Valid--------|                        |
    |                        |                           |                        |
    |<------5. Consent Page---|                           |                        |
    |     (show permissions)  |                           |                        |
    |                        |                           |                        |
    |--6. Approve Access---->|                           |                        |
    |                        |--7. Create Auth Code----->|                        |
    |                        |     (mcp_authorizations)  |                        |
    |<---8. Redirect w/ Code--|                           |                        |
    |                        |                           |                        |
    |--9. Exchange Code----->|                           |                        |
    |     /api/mcp/token     |                           |                        |
    |                        |--10. Verify & Create JWT-->|                        |
    |<---11. Access Token----|                           |                        |
    |     (JWT)              |                           |                        |
    |                        |                           |                        |
    |--12. API Call----------|--13. Validate JWT & User--|--14. Handle Request--->|
    |     (with token)       |                           |                        |
    |                        |<--15. Authorized Data-----|<--16. Response---------|
    |<---17. Result---------|                           |                        |
```

## Key Components

### 1. Database Tables (Supabase)

```sql
-- Run this in Supabase SQL editor
-- See: docs/MCP_MIGRATION.sql
```

**Tables created:**

- `mcp_clients`: Registered MCP applications
- `mcp_authorizations`: Issued authorization codes
- `mcp_refresh_tokens`: Long-lived refresh tokens
- `mcp_access_logs`: Audit trail

### 2. Frontend Pages

#### Authorization Page

**File**: `src/app/auth/mcp/authorize/page.tsx`

What it does:

- Shows MCP client requesting access
- Lists scopes being requested
- Displays user info for confirmation
- Handles approve/deny actions

Flow:

1. MCP client redirects user: `/auth/mcp/authorize?client_id=xxx&redirect_uri=xxx&scope=xxx`
2. User must be logged in (redirects to `/auth` if not)
3. Page fetches client info from `/api/mcp/client/[clientId]`
4. User clicks "Approve & Connect"
5. Calls `/api/mcp/authorize` to create authorization code
6. Redirects back to MCP client with code

### 3. API Endpoints

#### `POST /api/mcp/authorize`

Creates authorization code

**Request**:

```json
{
  "client_id": "your-mcp-client-id",
  "redirect_uri": "http://localhost:3000/callback",
  "scopes": ["openid", "profile", "email"],
  "user_id": "user-uuid-from-supabase"
}
```

**Response**:

```json
{
  "authorization_code": "abc123xyz...",
  "expires_in": 600
}
```

#### `POST /api/mcp/token`

Exchanges authorization code for access token

**Request**:

```json
{
  "grant_type": "authorization_code",
  "code": "abc123xyz...",
  "client_id": "your-mcp-client-id",
  "client_secret": "your-client-secret",
  "redirect_uri": "http://localhost:3000/callback"
}
```

**Response**:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "xyz789abc...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid profile email"
}
```

#### `GET /api/mcp/client/[clientId]`

Gets public client information

**Response**:

```json
{
  "id": "uuid",
  "client_id": "mcp-client-id",
  "name": "My MCP Client",
  "description": "Describes what this client does",
  "logo_url": "https://...",
  "scopes": ["openid", "profile", "email"]
}
```

## MCP Utilities

**File**: `src/utils/mcp-auth.ts`

Exported functions:

```typescript
// Generate authorization code
generateAuthorizationCode(length?: number): string

// Generate PKCE challenge (optional)
generatePKCE(): { verifier: string; challenge: string }

// Generate CSRF protection state
generateState(length?: number): string

// Build authorization URL for MCP client
buildMCPAuthUrl(
  baseUrl: string,
  clientId: string,
  redirectUri: string,
  scopes?: string[],
  state?: string
): string

// Generate login URL for MCP setup
generateMCPLoginUrl(
  appUrl: string,
  clientId: string,
  redirectUri: string,
  clientName: string
): string
```

## Step-by-Step Setup

### 1. Create Database Tables

In your Supabase dashboard:

1. Go to SQL Editor
2. Create new query
3. Copy content from `docs/MCP_MIGRATION.sql`
4. Run the query

This creates:

- `mcp_clients` table
- `mcp_authorizations` table
- `mcp_refresh_tokens` table
- `mcp_access_logs` table
- Indexes and RLS policies

### 2. Register MCP Client

Insert your MCP client into the database:

```sql
INSERT INTO mcp_clients (client_id, client_secret, name, description, redirect_uri, scopes)
VALUES (
  'my-mcp-client-id',
  'very-secure-secret-key-here',
  'My MCP Client',
  'Client that accesses my API',
  'http://localhost:3000/oauth/callback',
  ARRAY['openid', 'profile', 'email']
);
```

### 3. Update Environment Variables

```env
# Already set:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Add (optional):
JWT_SECRET=your-jwt-secret-for-mcp-tokens
```

### 4. Test the Flow Locally

```bash
pnpm dev
```

Then:

1. Generate MCP authorization URL:

```typescript
import { generateMCPLoginUrl } from '@/utils/mcp-auth';

const authUrl = generateMCPLoginUrl(
  'http://localhost:3000',
  'my-mcp-client-id',
  'http://localhost:3000/oauth/callback',
  'My MCP Client',
);

console.log(authUrl);
// Output: http://localhost:3000/auth/mcp/authorize?client_id=...
```

2. Open the URL in browser
3. Log in with your Supabase credentials
4. Approve access on consent screen
5. Get redirected back with authorization code

## MCP Client Implementation

Once you have the authorization code, implement token exchange:

### JavaScript/Node.js Example

```typescript
const authorizationCode = 'code-from-redirect';

const response = await fetch('http://localhost:3000/api/mcp/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    grant_type: 'authorization_code',
    code: authorizationCode,
    client_id: 'my-mcp-client-id',
    client_secret: 'my-client-secret',
    redirect_uri: 'http://localhost:3000/oauth/callback',
  }),
});

const { access_token, refresh_token } = await response.json();

// Store tokens securely
localStorage.setItem('mcp_access_token', access_token);
localStorage.setItem('mcp_refresh_token', refresh_token);

// Use token for API calls
const apiResponse = await fetch('http://localhost:3000/api/data', {
  headers: { Authorization: `Bearer ${access_token}` },
});
```

### Python Example

```python
import requests

auth_code = "code-from-redirect"

response = requests.post('http://localhost:3000/api/mcp/token', json={
    'grant_type': 'authorization_code',
    'code': auth_code,
    'client_id': 'my-mcp-client-id',
    'client_secret': 'my-client-secret',
    'redirect_uri': 'http://localhost:3000/oauth/callback'
})

tokens = response.json()
access_token = tokens['access_token']
refresh_token = tokens['refresh_token']

# Use for API calls
headers = {'Authorization': f'Bearer {access_token}'}
api_response = requests.get('http://localhost:3000/api/data', headers=headers)
```

## API Middleware

Validate MCP tokens in your API endpoints:

```typescript
// src/app/api/middleware/validate-mcp-token.ts

import { verifyToken } from '@/utils/token-utils';

export async function validateMCPToken(authorization: string | null) {
  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const token = authorization.substring(7);
  const decoded = verifyToken(token);

  if (decoded.type !== 'mcp_access_token') {
    throw new Error('Invalid token type');
  }

  return {
    userId: decoded.sub,
    clientId: decoded.client_id,
    scopes: decoded.scopes,
    email: decoded.email,
  };
}

// Usage in API route:
export async function GET(request: Request) {
  const auth = request.headers.get('authorization');

  try {
    const user = await validateMCPToken(auth);

    // Now you know:
    // - user.userId: which user is making the request
    // - user.clientId: which MCP client is requesting
    // - user.scopes: what permissions were granted

    // Handle request with user context
  } catch (error) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
```

## Security Features

✅ **OAuth 2.0 Authorization Code Flow** - Industry standard
✅ **Client Secret Validation** - Prevents unauthorized token exchange
✅ **Redirect URI Validation** - Prevents authorization code interception
✅ **CSRF Protection** - State parameter in authorization
✅ **Token Expiration** - Short-lived access tokens (1 hour)
✅ **Refresh Tokens** - Long-lived refresh tokens (30 days)
✅ **HTTPS in Production** - Secure cookie transmission
✅ **JWT Tokens** - Self-contained, tamper-proof tokens
✅ **Scoped Access** - Fine-grained permission control
✅ **Audit Logs** - Track all MCP client access

## Troubleshooting

### Authorization code not working

- Check if authorization code hasn't expired (10 minute timeout)
- Verify client_id and client_secret match database
- Ensure redirect_uri matches exactly

### Token validation fails

- Check JWT_SECRET environment variable is set
- Verify token hasn't expired
- Ensure Authorization header format: `Bearer <token>`

### User not found

- Verify user exists in Supabase auth
- Check user_id in authorization is correct

### Client not found

- Verify MCP client is registered in database
- Check client_id spelling matches exactly

## Production Checklist

- [ ] Set `JWT_SECRET` environment variable securely
- [ ] Use HTTPS for all OAuth redirects
- [ ] Store `client_secret` securely (never expose)
- [ ] Enable Supabase RLS policies for mcp\_\* tables
- [ ] Set up audit logging for compliance
- [ ] Configure IP whitelisting if needed
- [ ] Test token refresh flow
- [ ] Set up monitoring for failed authentications
- [ ] Document scopes and permissions
- [ ] Create client management UI for team

## Files Created

```
src/
├── utils/
│   └── mcp-auth.ts              # MCP utilities
├── app/
│   ├── auth/
│   │   └── mcp/
│   │       └── authorize/
│   │           └── page.tsx     # Consent screen
│   └── api/
│       └── mcp/
│           ├── authorize/
│           │   └── route.ts     # Create auth code
│           ├── token/
│           │   └── route.ts     # Exchange for token
│           └── client/
│               └── [clientId]/
│                   └── route.ts # Get client info
docs/
└── MCP_MIGRATION.sql            # Database setup
```

## Next Steps

1. **Run database migration** (`docs/MCP_MIGRATION.sql`)
2. **Register MCP client** in `mcp_clients` table
3. **Generate authorization URL** using `generateMCPLoginUrl()`
4. **Implement token exchange** in your MCP client
5. **Add middleware** to validate tokens
6. **Test full flow** locally
7. **Deploy to production**
8. **Monitor access logs** for security

## Support

For questions or issues:

1. Check this documentation
2. Review implementation files
3. Check Supabase logs
4. Enable debug logging in API routes
