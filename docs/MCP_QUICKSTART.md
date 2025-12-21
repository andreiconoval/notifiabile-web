# MCP Server Quick Start (5 minutes)

## What You Get

Your Next.js app becomes an **MCP OAuth Server** that:

- Authenticates MCP clients
- Manages user consent
- Issues secure tokens
- Tracks access logs

## Architecture

```
MCP Client (e.g., Copilot)
    ↓ Opens browser
Next.js App (Auth + Consent)
    ↓ Approves
Your .NET API (receives authenticated request)
```

## Quick Setup

### Step 1: Create Database Tables (2 min)

1. Open your Supabase dashboard
2. Go to SQL Editor
3. Create new query
4. Paste from `docs/MCP_MIGRATION.sql`
5. Run

### Step 2: Register MCP Client (1 min)

In Supabase SQL Editor, run:

```sql
INSERT INTO mcp_clients (client_id, client_secret, name, description, redirect_uri)
VALUES (
  'copilot-mcp-client',
  'your-super-secret-key-at-least-32-chars!',
  'GitHub Copilot',
  'AI code assistant',
  'http://localhost:5555/oauth/callback'
);
```

### Step 3: Get Authorization URL (< 1 min)

```typescript
import { generateMCPLoginUrl } from '@/utils/mcp-auth';

const url = generateMCPLoginUrl(
  'http://localhost:3000',
  'copilot-mcp-client',
  'http://localhost:5555/oauth/callback',
  'GitHub Copilot',
);

// Output: http://localhost:3000/auth/mcp/authorize?client_id=...
```

### Step 4: Test Flow

1. Run `pnpm dev`
2. Open the URL from Step 3 in browser
3. Log in with Supabase credentials
4. Approve access
5. You'll get redirected with authorization code

### Step 5: Exchange for Token

Your MCP client calls:

```bash
curl -X POST http://localhost:3000/api/mcp/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "code": "abc123xyz...",
    "client_id": "copilot-mcp-client",
    "client_secret": "your-super-secret-key-at-least-32-chars!",
    "redirect_uri": "http://localhost:5555/oauth/callback"
  }'
```

Response:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "xyz789abc...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Step 6: Use Token

MCP client uses token for all API calls:

```bash
curl http://localhost:3000/api/data \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

## File Structure

```
✅ src/utils/mcp-auth.ts
   └─ Utilities for MCP auth

✅ src/app/auth/mcp/authorize/page.tsx
   └─ Consent screen (user approves)

✅ src/app/api/mcp/authorize/route.ts
   └─ Creates authorization code

✅ src/app/api/mcp/token/route.ts
   └─ Exchanges code for token

✅ src/app/api/mcp/client/[clientId]/route.ts
   └─ Gets client info

✅ docs/MCP_MIGRATION.sql
   └─ Database setup

✅ docs/MCP_SERVER_SETUP.md
   └─ Full documentation
```

## Key Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret (optional)
```

## API Endpoints Reference

| Method | Endpoint                            | Purpose                 |
| ------ | ----------------------------------- | ----------------------- |
| GET    | `/auth/mcp/authorize?client_id=...` | Redirect user here      |
| POST   | `/api/mcp/authorize`                | Create auth code        |
| POST   | `/api/mcp/token`                    | Exchange code for token |
| GET    | `/api/mcp/client/[id]`              | Get client info         |

## Token Format

Access tokens are JWT with payload:

```json
{
  "sub": "user-id-uuid",
  "email": "user@example.com",
  "client_id": "copilot-mcp-client",
  "scopes": ["openid", "profile", "email"],
  "type": "mcp_access_token",
  "iat": 1701420000,
  "exp": 1701423600
}
```

## Validating Tokens in API

```typescript
import jwt from 'jsonwebtoken';

export async function validateMCPToken(authHeader: string) {
  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);

    if (decoded.type !== 'mcp_access_token') {
      throw new Error('Invalid token type');
    }

    return {
      userId: decoded.sub,
      email: decoded.email,
      clientId: decoded.client_id,
      scopes: decoded.scopes,
    };
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// In your API route:
export async function GET(request: Request) {
  const auth = request.headers.get('authorization');

  if (!auth) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await validateMCPToken(auth);

    // user.userId tells you which user is making request
    // user.clientId tells you which MCP client
    // use both to authorize the API call

    return Response.json({ data: 'authorized' });
  } catch (error) {
    return Response.json({ error: 'Invalid token' }, { status: 401 });
  }
}
```

## Security Checklist

- ✅ Client secret is 32+ characters
- ✅ client_secret only stored in database, never in browser
- ✅ Redirect URI validates exactly
- ✅ Authorization codes expire (10 minutes)
- ✅ Access tokens expire (1 hour)
- ✅ Refresh tokens expire (30 days)
- ✅ HTTPS in production
- ✅ JWT_SECRET is strong
- ✅ RLS policies enabled in Supabase

## Testing Checklist

- [ ] Authorization page loads with client info
- [ ] User must be logged in to approve
- [ ] Approve redirects with authorization code
- [ ] Code exchange returns valid JWT
- [ ] JWT expires after 1 hour
- [ ] Refresh token works
- [ ] Invalid client_id returns error
- [ ] Mismatched redirect_uri returns error
- [ ] API validates token and sets user context

## Common Issues

| Issue                  | Solution                                 |
| ---------------------- | ---------------------------------------- |
| "Invalid client"       | Check client_id in database              |
| "Invalid redirect URI" | Ensure redirect_uri matches exactly      |
| "Code expired"         | Authorization codes expire in 10 minutes |
| "Token invalid"        | Check JWT_SECRET is set correctly        |
| "User not found"       | Verify Supabase auth has user            |

## Next Steps

1. ✅ Complete setup above
2. ✅ Test OAuth flow manually
3. ✅ Implement token validation in your API
4. ✅ Create user management dashboard
5. ✅ Set up audit logging
6. ✅ Deploy to production
7. ✅ Monitor access patterns

## Resources

- **Full Documentation**: `docs/MCP_SERVER_SETUP.md`
- **Database Schema**: `docs/MCP_MIGRATION.sql`
- **Source Code**: `src/app/api/mcp/*` and `src/app/auth/mcp/*`
- **Utils**: `src/utils/mcp-auth.ts`
