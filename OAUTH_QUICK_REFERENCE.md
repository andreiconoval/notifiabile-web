# OAuth Quick Reference Card

## Essential Commands

### Register Client

```bash
curl -X POST https://your-backend.com/oauth/clients \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My App",
    "redirect_uris": ["http://localhost:5555/oauth/callback"],
    "scopes": ["openid", "profile", "email"]
  }'
```

### Set Environment

```bash
export NEXT_PUBLIC_OAUTH_CLIENT_ID="client-id-from-above"
export NEXT_PUBLIC_OAUTH_REDIRECT_URI="http://localhost:5555/oauth/callback"
export NEXT_PUBLIC_API_URL="http://localhost:3000"
export OAUTH_CLIENT_SECRET="secret-from-above"
```

### Start Development

```bash
cd notifiable-web
pnpm dev
```

## Essential Imports

### Use OAuth Button

```tsx
import { OAuthLoginButton } from '@/components/oauth-login-button';

<OAuthLoginButton>Login with OAuth</OAuthLoginButton>;
```

### Use OAuth Hook

```tsx
import { useOAuthCallback, verifyOAuthState } from '@/utils/oauth-client';

const { code, error, state } = useOAuthCallback();
```

### Initiate OAuth Manually

```tsx
import { initiateOAuthFlow } from '@/utils/oauth-client';

initiateOAuthFlow(clientId, redirectUri, scopes, authUrl);
```

## File Locations

| What               | Where                                      |
| ------------------ | ------------------------------------------ |
| Login button       | `src/components/oauth-login-button.tsx`    |
| Client utilities   | `src/utils/oauth-client.ts`                |
| Callback page      | `src/app/oauth/callback/page.tsx`          |
| Token exchange API | `src/app/api/auth/oauth/callback/route.ts` |
| Consent screen     | `src/app/oauth/consent/page.tsx`           |
| Decision API       | `src/app/api/oauth/decision/route.ts`      |

## OAuth Flow

```
User
  ↓ Clicks "Login"
Consent Screen (/oauth/consent)
  ↓ User approves
Your Callback Page (/oauth/callback?code=...)
  ↓
Token Exchange API (/api/auth/oauth/callback)
  ↓ Exchanges code for token
✓ Logged In
```

## Environment Variables

```env
# Required
NEXT_PUBLIC_OAUTH_CLIENT_ID=xxx
NEXT_PUBLIC_OAUTH_REDIRECT_URI=http://localhost:5555/oauth/callback
NEXT_PUBLIC_API_URL=http://localhost:3000
OAUTH_CLIENT_SECRET=yyy
```

## Testing URLs

```
Authorization URL:
http://localhost:3000/oauth/authorize?client_id=xxx&redirect_uri=http://localhost:5555/oauth/callback&response_type=code&scope=openid+profile+email

Callback:
http://localhost:3000/oauth/callback?code=AUTH_CODE&state=STATE

Dashboard:
http://localhost:3000/dashboard
```

## Key Functions

### 1. Start OAuth Flow

```typescript
initiateOAuthFlow(
  clientId: string,
  redirectUri: string,
  scopes?: string,
  authUrl?: string
) → void
```

### 2. Get Callback Info

```typescript
useOAuthCallback() → {
  code?: string,
  error?: string,
  state?: string,
  errorDescription?: string,
  isProcessing: boolean
}
```

### 3. Verify State (CSRF)

```typescript
verifyOAuthState(stateFromCallback: string) → boolean
```

### 4. Exchange Code for Token

```typescript
exchangeCodeForToken(
  code: string,
  tokenEndpoint: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
) → Promise<{access_token, refresh_token, expires_in}>
```

### 5. Refresh Token

```typescript
refreshAccessToken(
  refreshToken: string,
  tokenEndpoint: string,
  clientId: string,
  clientSecret: string
) → Promise<{access_token, expires_in}>
```

## Documentation Files

| Guide                                  | When to Use                |
| -------------------------------------- | -------------------------- |
| `docs/OAUTH_SETUP.md`                  | Full setup & configuration |
| `docs/OAUTH_CLIENT_SETUP.md`           | Implementing your client   |
| `docs/OAUTH_IMPLEMENTATION_SUMMARY.md` | Quick reference            |
| `.github/copilot-instructions.md`      | AI agent guidance          |

## Troubleshooting

| Issue                   | Fix                                                    |
| ----------------------- | ------------------------------------------------------ |
| "Invalid client_id"     | Verify client registered & ID matches                  |
| "State mismatch"        | Clear browser storage & try again                      |
| "Redirect URI mismatch" | Ensure URL matches exactly (case-sensitive)            |
| Token not in request    | Check httpOnly cookie is set in browser DevTools       |
| No callback received    | Verify redirect_uri is accessible & matches registered |

## Security Checklist

- [ ] State parameter generated and verified ✓
- [ ] HttpOnly cookies used for token storage ✓
- [ ] HTTPS in production ✓
- [ ] client_secret stored in environment ✓
- [ ] redirect_uri validated ✓
- [ ] Token refresh implemented ✓

## Local Testing

```bash
# Terminal 1: Start notifiable-web
pnpm dev  # Runs on port 3000

# Terminal 2: Start your app
npm start  # Runs on your configured port

# Browser: Test the OAuth flow
# http://your-app:port/login
# Click OAuth button
# Approve on consent screen
# Should redirect back with token
```

## API Response Examples

### Successful Token Exchange

```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

### Error Response

```json
{
  "error": "invalid_grant",
  "error_description": "Authorization code has expired"
}
```

## Cookie Inspection

DevTools → Application → Cookies:

```
Name: access_token
Value: eyJhbGc...
HttpOnly: ✓ (checked - secure)
Secure: ✓ (production)
SameSite: Lax
```

## Common Ports

| Service        | Port | URL                                  |
| -------------- | ---- | ------------------------------------ |
| notifiable-web | 3000 | http://localhost:3000                |
| Your app       | 5555 | http://localhost:5555                |
| Your callback  | 5555 | http://localhost:5555/oauth/callback |

## Scopes Reference

Common OAuth scopes:

```
openid       # User identification
profile      # Full name, picture, etc.
email        # Email address
offline_access  # Refresh token support
```

## Next Steps

1. ✅ Register client in Supabase/backend
2. ✅ Set environment variables
3. ✅ Test locally
4. ✅ Deploy to production
5. ✅ Monitor and maintain

---

**Quick Reference**: OAuth 2.0 Authorization Code Flow  
**Status**: Ready to use  
**Support**: See full docs in `docs/` folder
