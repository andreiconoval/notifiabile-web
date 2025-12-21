# OAuth Client Integration Guide

This guide explains how to set up your copilot/MCP client to authenticate with notifiable-web via OAuth.

## Prerequisites

- notifiable-web running at `http://localhost:3000`
- Supabase project configured with OAuth
- Your copilot client listening on a local callback URL (e.g., `http://localhost:5555/oauth/callback`)

## Step 1: Register Your Client

Register your copilot as an OAuth client in Supabase or your backend:

```bash
# Example: Register a client named "Copilot MCP"
curl -X POST https://your-backend.com/oauth/clients \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Copilot MCP",
    "redirect_uris": ["http://localhost:5555/oauth/callback"],
    "scopes": ["openid", "profile", "email"],
    "grant_types": ["authorization_code", "refresh_token"]
  }'
```

Response:

```json
{
  "client_id": "copilot_mcp_xyz123",
  "client_secret": "secret_abc456def789",
  "redirect_uri": "http://localhost:5555/oauth/callback"
}
```

Store these securely in your copilot config:

```toml
# ~/.codex/config.toml or equivalent
[oauth]
client_id = "copilot_mcp_xyz123"
client_secret = "secret_abc456def789"
redirect_uri = "http://localhost:5555/oauth/callback"
auth_url = "http://localhost:3000/oauth/authorize"
token_url = "https://your-backend.com/oauth/token"
```

## Step 2: Initiate OAuth Flow

When user logs in without a token, redirect to the authorization URL:

```python
# Example pseudocode (Python/JavaScript)
import webbrowser
import urllib.parse

def login_with_oauth():
    auth_url = "http://localhost:3000/oauth/authorize"
    params = {
        "client_id": config["oauth"]["client_id"],
        "redirect_uri": config["oauth"]["redirect_uri"],
        "response_type": "code",
        "scope": "openid profile email",
        "state": generate_random_state(),  # For CSRF protection
    }

    full_url = f"{auth_url}?{urllib.parse.urlencode(params)}"
    webbrowser.open(full_url)
    # Browser opens → notifiable-web → consent screen → redirect back
```

## Step 3: Listen for Callback

Your copilot client needs a local HTTP server to receive the callback:

```python
# Example: Simple callback listener
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json

class OAuthCallbackHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Parse /oauth/callback?code=XXX&state=YYY
        parsed_url = urlparse(self.path)
        query = parse_qs(parsed_url.query)

        code = query.get("code", [None])[0]
        state = query.get("state", [None])[0]
        error = query.get("error", [None])[0]

        if error:
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": error}).encode())
            return

        if code:
            # Exchange code for token (Step 4)
            try:
                token_response = exchange_code_for_token(code, state)
                save_token(token_response["access_token"])

                # Respond with success
                self.send_response(200)
                self.send_header("Content-Type", "text/html")
                self.end_headers()
                html = """
                <html>
                  <body>
                    <h1>Login Successful</h1>
                    <p>You can close this window and return to the app.</p>
                  </body>
                </html>
                """
                self.wfile.write(html.encode())
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
        else:
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Missing authorization code"}).encode())

    def log_message(self, format, *args):
        pass  # Suppress default logging

# Start server on 5555
server = HTTPServer(("localhost", 5555), OAuthCallbackHandler)
server.serve_forever()
```

## Step 4: Exchange Code for Token

On receiving the callback, exchange the authorization code for an access token:

```python
import requests

def exchange_code_for_token(code, state):
    """
    Exchange authorization code for access token.
    Verify state matches to prevent CSRF attacks.
    """
    config = load_config()  # Load from ~/.codex/config.toml

    # Verify state
    if state != get_stored_state():
        raise ValueError("State mismatch - possible CSRF attack")

    token_endpoint = config["oauth"]["token_url"]

    payload = {
        "grant_type": "authorization_code",
        "code": code,
        "client_id": config["oauth"]["client_id"],
        "client_secret": config["oauth"]["client_secret"],
        "redirect_uri": config["oauth"]["redirect_uri"],
    }

    response = requests.post(token_endpoint, data=payload)
    response.raise_for_status()

    return response.json()  # {"access_token": "...", "refresh_token": "...", "expires_in": 3600}
```

## Step 5: Store Token & Use It

Save the token for subsequent requests:

```python
import json
import os

def save_token(access_token, refresh_token=None, expires_in=3600):
    """Store token in config file."""
    config = load_config()
    config["auth"] = {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "expires_at": time.time() + expires_in,
    }
    save_config(config)

def get_auth_header():
    """Get Authorization header for API calls."""
    token = load_config().get("auth", {}).get("access_token")
    if not token:
        raise ValueError("Not authenticated. Run login first.")
    return {"Authorization": f"Bearer {token}"}

# Use in API calls
def get_notifications():
    headers = get_auth_header()
    response = requests.get(
        "https://api.notifiable.io/v1/notifications",
        headers=headers
    )
    return response.json()
```

## Step 6: Handle Token Refresh

Access tokens expire. Use the refresh token to get a new one:

```python
def refresh_access_token():
    """Use refresh token to get a new access token."""
    config = load_config()
    refresh_token = config.get("auth", {}).get("refresh_token")

    if not refresh_token:
        raise ValueError("No refresh token. Re-authenticate.")

    token_endpoint = config["oauth"]["token_url"]

    payload = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "client_id": config["oauth"]["client_id"],
        "client_secret": config["oauth"]["client_secret"],
    }

    response = requests.post(token_endpoint, data=payload)
    response.raise_for_status()

    token_data = response.json()
    save_token(
        token_data["access_token"],
        token_data.get("refresh_token", refresh_token),
        token_data.get("expires_in", 3600)
    )

    return token_data["access_token"]

# Decorator to auto-refresh before API calls
def ensure_token_valid(func):
    def wrapper(*args, **kwargs):
        config = load_config()
        expires_at = config.get("auth", {}).get("expires_at", 0)

        if time.time() > expires_at - 300:  # Refresh 5 min before expiry
            refresh_access_token()

        return func(*args, **kwargs)
    return wrapper
```

## Flow Diagram

```
┌─────────────┐
│  Copilot    │
│   Client    │
└──────┬──────┘
       │
       │ 1. Browser.open(auth_url)
       ▼
┌──────────────────────────┐
│  http://localhost:3000   │
│  /oauth/authorize        │
└──────┬───────────────────┘
       │
       │ 2. Redirect to consent
       ▼
┌──────────────────────────┐
│  /oauth/consent?auth_id  │
│  (Shows scopes)          │
└──────┬───────────────────┘
       │
       │ 3. User clicks "Approve"
       ▼
┌──────────────────────────┐
│  /api/oauth/decision     │
│  (POST)                  │
└──────┬───────────────────┘
       │
       │ 4. Supabase approves
       ▼
┌──────────────────────────┐
│  http://localhost:5555   │
│  /oauth/callback?code=X  │
└──────┬───────────────────┘
       │
       │ 5. Exchange code → token
       ▼
┌──────────────────────────┐
│  /api/oauth/token        │
│  (POST with code)        │
└──────┬───────────────────┘
       │
       │ 6. Return access_token
       ▼
┌─────────────┐
│  Copilot    │
│  ✓ Logged in│
└─────────────┘
```

## Troubleshooting

| Issue                 | Solution                                                                   |
| --------------------- | -------------------------------------------------------------------------- |
| Callback not received | Ensure copilot is listening on `redirect_uri` port; check firewall         |
| "Invalid client_id"   | Verify client is registered in Supabase; check client ID matches           |
| "Invalid state"       | Implement proper state verification; ensure state is saved before redirect |
| Token expired         | Implement token refresh logic; check `expires_in` from token response      |
| CORS errors           | Ensure notifiable-web has CORS configured for your copilot's origin        |

## Testing Locally

```bash
# Terminal 1: Start notifiable-web
cd notifiable-web
pnpm dev  # Runs on 3000

# Terminal 2: Start copilot callback listener
python copilot_oauth_server.py  # Runs on 5555

# Terminal 3: Trigger login
curl "http://localhost:5555/login"
# Opens browser → shows consent → redirects back with token
```

## Security Considerations

- ✅ Always verify `state` parameter to prevent CSRF
- ✅ Store `client_secret` securely (never expose in frontend)
- ✅ Use HTTPS in production (not localhost)
- ✅ Validate redirect URIs match registered values
- ✅ Implement token refresh logic
- ✅ Clear tokens on logout
- ❌ Don't log access tokens
- ❌ Don't hardcode secrets in code
