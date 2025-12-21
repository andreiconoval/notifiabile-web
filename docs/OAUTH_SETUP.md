# OAuth Setup & Configuration Guide

This guide helps you set up OAuth authentication for your copilot/MCP client or external applications to authenticate with notifiable-web.

## Quick Start

### 1. Environment Setup

Add these variables to your `.env.local`:

```env
NEXT_PUBLIC_OAUTH_CLIENT_ID=your-client-id
NEXT_PUBLIC_OAUTH_REDIRECT_URI=http://localhost:5555/oauth/callback
NEXT_PUBLIC_API_URL=http://localhost:3000
OAUTH_CLIENT_SECRET=your-client-secret
```

### 2. Add OAuth Login Button

Update your auth page or add a login component:

```tsx
import { OAuthLoginButton } from '@/components/oauth-login-button';

export default function LoginPage() {
  return (
    <div>
      <OAuthLoginButton>Login with Notifiable OAuth</OAuthLoginButton>
    </div>
  );
}
```

### 3. Handle Callback

The callback page is pre-configured at `/oauth/callback`. It will:

1. Receive the authorization code from notifiable-web
2. Exchange it for an access token
3. Store the token securely
4. Redirect to dashboard

## Architecture

### Files

| File                                       | Purpose                                    |
| ------------------------------------------ | ------------------------------------------ |
| `src/app/oauth/consent/page.tsx`           | Consent screen where user approves scopes  |
| `src/app/api/oauth/decision/route.ts`      | Processes approve/deny decision            |
| `src/app/oauth/callback/page.tsx`          | Receives auth code and exchanges for token |
| `src/app/api/auth/oauth/callback/route.ts` | API route handling token exchange          |
| `src/utils/oauth-client.ts`                | Client-side OAuth utilities                |
| `src/components/oauth-login-button.tsx`    | Reusable login button component            |

### Sequence Diagram

```
Copilot Client          notifiable-web              Backend
     │                      │                          │
     │ 1. Click OAuth Login │                          │
     ├─────────────────────>│                          │
     │ Redirect to /oauth/  │                          │
     │ authorize?client_id  │                          │
     │                      │ 2. Check auth            │
     │                      │ (user already logged in) │
     │                      │                          │
     │ 3. Show consent      │                          │
     │    screen            │                          │
     │<─────────────────────┤                          │
     │                      │                          │
     │ 4. User clicks       │                          │
     │    "Approve"         │                          │
     ├─────────────────────>│ /api/oauth/decision      │
     │                      ├─────────────────────────>│
     │                      │ Approve authorization    │
     │                      │<─────────────────────────┤
     │                      │ Redirect with code       │
     │ 5. Redirect to       │                          │
     │    /oauth/callback?  │                          │
     │    code=XXX&state=YY │                          │
     │<─────────────────────┤                          │
     │                      │                          │
     │ 6. Send code to      │                          │
     │    /api/auth/oauth/  │                          │
     │    callback          │                          │
     ├─────────────────────────────────────────────────>│
     │                                                 │
     │    Exchange code for token                      │
     │    Store token in httpOnly cookie               │
     │                                                 │
     │ 7. Receive success   │                          │
     │    Set cookie        │                          │
     │<─────────────────────────────────────────────────┤
     │                      │                          │
     │ 8. Redirect to       │                          │
     │    /dashboard        │                          │
     │ ✓ Logged in          │                          │
     │                      │                          │
```

## Configuration Details

### 1. Registering OAuth Client

Before users can authenticate, you need to register your client application.

**Option A: Using Admin API**

```bash
curl -X POST https://your-backend.com/oauth/clients \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Copilot",
    "redirect_uris": ["http://localhost:5555/oauth/callback"],
    "scopes": ["openid", "profile", "email"],
    "grant_types": ["authorization_code", "refresh_token"]
  }'
```

**Option B: Via Supabase Console**

1. Go to Supabase Dashboard → Authentication
2. Navigate to Providers
3. Create new OAuth app with:
   - **Name**: Your app name
   - **Redirect URIs**: Your callback URL
   - **Scopes**: `openid profile email`

Response includes:

- `client_id`: Public identifier
- `client_secret`: Keep secure
- `redirect_uri`: Must match exactly

### 2. Store Credentials Securely

```toml
# ~/.codex/config.toml (example for Codex)
[oauth]
client_id = "your-public-client-id"
client_secret = "your-secret-keep-safe"
redirect_uri = "http://localhost:5555/oauth/callback"
auth_url = "http://localhost:3000/oauth/authorize"
token_url = "https://your-backend.com/oauth/token"
```

Never commit secrets to version control. Use environment variables in production.

### 3. Environment Variables

```env
# Frontend (visible in browser, safe)
NEXT_PUBLIC_OAUTH_CLIENT_ID=xxx
NEXT_PUBLIC_OAUTH_REDIRECT_URI=http://localhost:5555/oauth/callback
NEXT_PUBLIC_API_URL=http://localhost:3000

# Backend (kept secret)
OAUTH_CLIENT_SECRET=yyy
```

## User Flow

### For End Users

1. **Click OAuth Login** → Opens notifiable-web consent page
2. **Review Permissions** → Sees requested scopes
3. **Click Approve/Deny** → Grants or denies access
4. **Redirected Back** → App receives access token
5. **Logged In** → Token stored securely

### For Developers

1. **Initialize OAuth** → Call `initiateOAuthFlow()`
2. **Receive Callback** → Browser redirected with `?code=` + `?state=`
3. **Verify State** → Check CSRF protection
4. **Exchange Code** → POST to `/api/auth/oauth/callback`
5. **Store Token** → Saved in httpOnly cookie
6. **Use Token** → Include in API requests as `Authorization: Bearer <token>`

## Code Examples

### Initiate OAuth Flow

```tsx
import { OAuthLoginButton } from '@/components/oauth-login-button';

export default function LoginPage() {
  return (
    <OAuthLoginButton
      clientId={process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID}
      redirectUri={process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI}
      scopes="openid profile email"
    >
      Login with OAuth
    </OAuthLoginButton>
  );
}
```

### Handle Callback

```tsx
'use client';

import { useOAuthCallback, verifyOAuthState } from '@/utils/oauth-client';
import { useEffect } from 'react';

export default function CallbackPage() {
  const { code, error, state } = useOAuthCallback();

  useEffect(() => {
    if (code) {
      // Verify state to prevent CSRF
      if (!verifyOAuthState(state)) {
        console.error('State mismatch');
        return;
      }

      // Exchange code for token
      fetch('/api/auth/oauth/callback', {
        method: 'POST',
        body: JSON.stringify({ code, state }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            window.location.href = '/dashboard';
          }
        });
    }
  }, [code, state]);

  return <div>Processing login...</div>;
}
```

### Use Token in API Calls

```ts
// Token is automatically stored in httpOnly cookie
// Browser sends it automatically with requests

// For manual API calls:
async function getNotifications() {
  const response = await fetch('https://api.notifiable.io/v1/notifications', {
    headers: {
      // Token is sent automatically in cookie
      // No need to add Authorization header
    },
  });
  return response.json();
}
```

## Security Best Practices

✅ **Do:**

- Store `client_secret` only on backend/secure storage
- Verify `state` parameter to prevent CSRF
- Use `httpOnly` cookies for tokens (can't be accessed by JS)
- Implement token refresh logic
- Use HTTPS in production
- Validate `redirect_uri` matches registered value
- Store refresh tokens separately with longer TTL

❌ **Don't:**

- Expose `client_secret` in frontend code
- Log tokens or sensitive data
- Store tokens in localStorage (vulnerable to XSS)
- Skip state verification
- Use hardcoded redirect URIs
- Accept arbitrary redirect URIs

## Troubleshooting

### "Invalid client_id"

**Cause**: Client not registered or ID doesn't match

**Fix**:

```bash
# Verify client exists
curl https://your-backend.com/oauth/clients/{client_id} \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### "State mismatch"

**Cause**: CSRF attack or session cleared

**Fix**: Clear browser storage and try again

### "Redirect URI mismatch"

**Cause**: Callback URL doesn't match registered URI exactly

**Fix**: Ensure URLs match exactly (case-sensitive, same port/protocol)

- Registered: `http://localhost:5555/oauth/callback`
- Used: `http://localhost:5555/oauth/callback` ✓
- Used: `http://localhost:5555/oauth/callback/` ✗ (trailing slash)

### "Token expired"

**Cause**: Access token has expired (typically 1 hour)

**Fix**: Use refresh token to get new token

```ts
const newToken = await refreshAccessToken(refreshToken, tokenEndpoint, clientId, clientSecret);
```

### "Cookie not being sent"

**Cause**: Missing `SameSite=Lax` or `Secure` flags

**Fix**: Check cookie settings in `/api/auth/oauth/callback/route.ts`

## Testing

### Local Testing

```bash
# Terminal 1: Start notifiable-web
cd notifiable-web
pnpm dev  # http://localhost:3000

# Terminal 2: Start your client app
cd copilot-client
npm start  # http://localhost:5555

# Browser: Visit http://localhost:5555/login
# Click OAuth login → Redirected to localhost:3000
# Approve → Redirected back to localhost:5555 with token
```

### Using cURL

```bash
# 1. Get authorization code
curl "http://localhost:3000/oauth/authorize?client_id=xxx&redirect_uri=http://localhost:5555/callback&response_type=code&scope=openid+profile+email"

# 2. Exchange code for token
curl -X POST http://localhost:3000/api/oauth/token \
  -d "grant_type=authorization_code" \
  -d "code=RECEIVED_CODE" \
  -d "client_id=xxx" \
  -d "client_secret=yyy" \
  -d "redirect_uri=http://localhost:5555/callback"

# 3. Use token
curl -H "Authorization: Bearer RECEIVED_TOKEN" \
  http://localhost:3000/api/notifications
```

## Production Deployment

### Before Going Live

- [ ] Use HTTPS (not http)
- [ ] Register production redirect URI
- [ ] Generate strong `client_secret`
- [ ] Store secrets in environment variables (not code)
- [ ] Enable CSRF protection (state parameter)
- [ ] Implement token refresh
- [ ] Set appropriate `maxAge` for cookies
- [ ] Test error scenarios
- [ ] Monitor failed authentication attempts
- [ ] Have fallback authentication method

### Production Environment Variables

```env
# Production
NEXT_PUBLIC_OAUTH_CLIENT_ID=prod-client-id
NEXT_PUBLIC_OAUTH_REDIRECT_URI=https://myapp.com/oauth/callback
NEXT_PUBLIC_API_URL=https://api.myapp.com
OAUTH_CLIENT_SECRET=prod-secret-xxxxx
NODE_ENV=production
```

## Support & Resources

- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [PKCE Extension (RFC 7636)](https://tools.ietf.org/html/rfc7636)

## Questions?

Check the following for implementation details:

- `src/app/oauth/consent/page.tsx` - Consent UI
- `src/app/api/oauth/decision/route.ts` - Decision handling
- `src/app/oauth/callback/page.tsx` - Callback handling
- `src/utils/oauth-client.ts` - Client utilities
