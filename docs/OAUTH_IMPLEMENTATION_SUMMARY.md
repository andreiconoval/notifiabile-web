# OAuth Implementation Summary

This document summarizes the OAuth implementation for notifiable-web and how to use it from a copilot/MCP client or external application.

## What Was Implemented

### 1. **OAuth Consent Flow** (`/oauth/consent`)

- User approves/denies access to their data
- Shows requested scopes and client information
- Redirects back to your application with authorization code

### 2. **OAuth Decision Handler** (`/api/oauth/decision`)

- Processes user's approval or denial
- Calls Supabase to finalize authorization
- Returns redirect URL with authorization code or error

### 3. **OAuth Callback Page** (`/oauth/callback`)

- Receives authorization code from notifiable-web
- Exchanges code for access token
- Stores token securely in httpOnly cookie
- Redirects to dashboard on success

### 4. **OAuth Client Utilities** (`src/utils/oauth-client.ts`)

- `initiateOAuthFlow()` - Start the OAuth flow
- `useOAuthCallback()` - React hook to handle callback
- `verifyOAuthState()` - CSRF protection
- `exchangeCodeForToken()` - Token exchange helper
- `refreshAccessToken()` - Token refresh logic

### 5. **OAuth Login Button** (`src/components/oauth-login-button.tsx`)

- Drop-in React component for initiating OAuth
- Handles state generation and CSRF protection
- Easy to customize

## Quick Setup for Your Client

### Step 1: Register Your Client

```bash
# Example using admin API
curl -X POST https://your-backend.com/oauth/clients \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "name": "My Copilot",
    "redirect_uris": ["http://localhost:5555/oauth/callback"],
    "scopes": ["openid", "profile", "email"]
  }'
```

Get `client_id` and `client_secret` from response.

### Step 2: Set Environment Variables

```env
NEXT_PUBLIC_OAUTH_CLIENT_ID=your-client-id
NEXT_PUBLIC_OAUTH_REDIRECT_URI=http://localhost:5555/oauth/callback
NEXT_PUBLIC_API_URL=http://localhost:3000
OAUTH_CLIENT_SECRET=your-client-secret
```

### Step 3: Add Login Button

```tsx
import { OAuthLoginButton } from '@/components/oauth-login-button';

export default function LoginPage() {
  return <OAuthLoginButton>Login with OAuth</OAuthLoginButton>;
}
```

### Step 4: Implement Callback Handler

Your app's `/oauth/callback` page will:

1. Extract `code` from URL
2. Verify `state` parameter
3. Call your backend `/api/auth/oauth/callback`
4. Backend exchanges code for token
5. Token stored in httpOnly cookie
6. User redirected to dashboard

Done! User is now logged in.

## File Reference

### Frontend Pages & Components

```
src/
├── app/
│   ├── oauth/
│   │   ├── consent/page.tsx          # Consent screen
│   │   └── callback/page.tsx         # Callback handler
│   └── api/
│       ├── oauth/decision/route.ts   # Approve/deny endpoint
│       └── auth/oauth/callback/route.ts  # Token exchange
├── components/
│   └── oauth-login-button.tsx        # Login button component
└── utils/
    └── oauth-client.ts                # OAuth utilities
```

### Documentation

```
docs/
├── OAUTH_SETUP.md                    # Full setup guide
├── OAUTH_CLIENT_SETUP.md             # Client implementation guide
└── OAuth_Implementation_Summary.md   # This file
```

## Data Flow

```
User (External App)
    │
    │ 1. Clicks "Login with OAuth"
    ▼
Your App (/login)
    │
    │ 2. Calls initiateOAuthFlow()
    ▼
notifiable-web (/oauth/authorize)
    │
    │ 3. Redirects to consent page
    ▼
notifiable-web (/oauth/consent)
    │
    │ 4. User reviews scopes and clicks "Approve"
    ▼
notifiable-web (/api/oauth/decision)
    │
    │ 5. Processes approval, gets auth code from Supabase
    ▼
Your App (/oauth/callback?code=XXX&state=YYY)
    │
    │ 6. Verifies state, exchanges code for token
    ▼
Your Backend (/api/auth/oauth/callback)
    │
    │ 7. Makes token exchange request to backend
    ▼
Backend (/oauth/token)
    │
    │ 8. Returns access_token + refresh_token
    ▼
Your App
    │
    │ 9. Stores token in httpOnly cookie
    ▼
Logged In! ✓
```

## API Endpoints Summary

### notifiable-web Endpoints

| Endpoint                   | Method | Purpose                 | Redirect            |
| -------------------------- | ------ | ----------------------- | ------------------- |
| `/oauth/authorize`         | GET    | Initiate OAuth flow     | → `/oauth/consent`  |
| `/oauth/consent`           | GET    | Show consent screen     | ← User approves     |
| `/api/oauth/decision`      | POST   | Process approval/denial | → Your app callback |
| `/api/auth/oauth/callback` | POST   | Exchange code for token | ← Your app          |

### Your App Endpoints (to implement)

| Endpoint                   | Method | Purpose                      |
| -------------------------- | ------ | ---------------------------- |
| `/oauth/callback`          | GET    | Receive auth code & redirect |
| `/api/auth/oauth/callback` | POST   | Exchange code for token      |
| `/login`                   | GET    | OAuth login page             |

## Security Features

✅ **Built-in:**

- State parameter verification (CSRF protection)
- HttpOnly cookies (XSS protection)
- Secure token storage
- Token refresh mechanism
- Error handling

✅ **Recommended:**

- Use HTTPS in production
- Implement rate limiting on token endpoint
- Monitor failed auth attempts
- Rotate client secrets regularly
- Use strong client IDs/secrets

## Common Use Cases

### Use Case 1: Copilot MCP Integration

```python
# Your copilot client
def login():
    oauth = OAuthClient(
        client_id="copilot-xxx",
        redirect_uri="http://localhost:5555/oauth/callback"
    )
    # Opens browser → notifiable-web → approves → gets token
    token = oauth.initiate_flow()
    save_token(token)
    api_call_with_token()
```

### Use Case 2: Third-Party SaaS Integration

```javascript
// Your SaaS app
const handleLogin = () => {
  window.location.href = `${NOTIFIABLE_URL}/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}`;
  // User approves → receives token → stores in session
};
```

### Use Case 3: CLI Tool Authentication

```bash
# Your CLI tool
$ myapp login
Opening browser to approve access...
✓ Authorization approved
✓ Token saved to ~/.myapp/config
Ready to use!
```

## Troubleshooting Guide

See `docs/OAUTH_SETUP.md` for detailed troubleshooting, including:

- "Invalid client_id" errors
- "State mismatch" errors
- "Redirect URI mismatch" errors
- Token expiration handling
- Cookie not being sent issues

## Testing

### Local Testing

```bash
# Start notifiable-web
pnpm dev

# Start your app
npm start

# Visit: http://localhost:YOUR_PORT/login
# Click OAuth login
# Approve on consent screen
# Should redirect back with token
```

### Manual cURL Testing

```bash
# 1. Initiate flow (opens browser manually)
# Visit: http://localhost:3000/oauth/authorize?client_id=test&redirect_uri=http://localhost:5555/callback

# 2. Approve manually (or use POST to /api/oauth/decision)

# 3. Exchange code
curl -X POST http://localhost:3000/api/auth/oauth/callback \
  -H "Content-Type: application/json" \
  -d '{"code":"AUTH_CODE","state":"STATE"}'
```

## Production Checklist

- [ ] HTTPS enabled (not http)
- [ ] Production client registered
- [ ] `client_secret` in environment variables
- [ ] `redirect_uri` set to production domain
- [ ] Token refresh logic implemented
- [ ] Cookie `Secure` flag enabled
- [ ] CORS configured if needed
- [ ] Error handling for all failure cases
- [ ] Rate limiting on token endpoint
- [ ] Monitoring for failed auth attempts
- [ ] Fallback authentication method available

## Key Files to Review

1. **`src/app/oauth/consent/page.tsx`** - Understand consent flow
2. **`src/app/api/oauth/decision/route.ts`** - See how decisions are processed
3. **`src/app/oauth/callback/page.tsx`** - Callback handling logic
4. **`src/utils/oauth-client.ts`** - Client-side utilities
5. **`docs/OAUTH_SETUP.md`** - Complete setup guide

## Next Steps

1. **Register your client** with notifiable-web backend
2. **Copy client credentials** to your environment
3. **Implement callback handler** at your redirect URI
4. **Test locally** with curl or browser
5. **Deploy to production** with HTTPS

## Need Help?

- Check error logs in browser console (`/oauth/callback`)
- Review API response in network tab
- Verify environment variables are set
- Ensure redirect URI matches exactly
- Check Supabase logs for auth issues

---

**Last Updated**: December 1, 2025  
**OAuth Implementation**: OAuth 2.0 Authorization Code Flow  
**Framework**: Next.js 16 + Supabase Auth
