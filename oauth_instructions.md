# Task: Implement Supabase OAuth Consent Flow (Next.js + Supabase)

## Context

- Frontend stack: **Next.js (App Router) + TypeScript**.
- Auth backend: **Supabase Auth + Supabase OAuth Server** already enabled.
- Environment variables are already available:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- The Supabase OAuth Server is configured with:
  - **Site URL**: `http://localhost:3000`
  - **Authorization Path**: `/oauth/consent`
- There is (or will be) a login page at `/login` that can receive a `?redirect=` query string.

Your job is to build the **authorization / consent UI** that Supabase uses during the OAuth flow, plus the API endpoint that finalizes the approval/denial.

---

## High-level behaviour

1. Supabase redirects the browser to  
   `http://localhost:3000/oauth/consent?authorization_id=<id>`.
2. The Next.js page:
   - Ensures the user is authenticated with Supabase.
   - Loads the OAuth authorization details for that `authorization_id`.
   - Shows a UI: client name, requested scopes, etc.
   - Lets the user **Approve** or **Deny**.
3. On approve/deny:
   - A POST request is sent to `/api/oauth/decision` with:
     - `authorization_id`
     - `decision` (`"approve"` or `"deny"`).
   - The API route calls the appropriate Supabase OAuth helper.
   - Supabase returns a `redirect_to` URL.
   - The API route responds with a redirect to that URL.
4. The browser follows that redirect back to the MCP client (or other OAuth client) with the auth code or error.

---

## Requirements for implementation

### 1. Consent page route

**Create:**

- `app/oauth/consent/page.tsx`

**Implementation details:**

1. This must be an **async server component** using the **App Router**.
2. Read the query param `authorization_id` from `searchParams`.
   - If missing, render a simple error: `Missing authorization_id`.
3. Use `@supabase/ssr`’s `createServerClient` with `cookies` from `next/headers` to create a Supabase server client.
4. Check if the user is logged in:
   - Call `supabase.auth.getUser()`.
   - If no user:
     - Redirect to `/login?redirect=<encodedOriginalPath>`, where:
       - `encodedOriginalPath` is URL-encoded `/oauth/consent?authorization_id=...`.
5. When the user is authenticated:
   - Call `supabase.auth.oauth.getAuthorizationDetails(authorization_id)`.
   - Handle error cases (null/undefined result or Supabase error) by rendering an error message.
6. Display a simple consent UI that includes at least:
   - The OAuth client name (`authDetails.client.name`).
   - The `redirect_uri` (`authDetails.redirect_uri`).
   - A list of scopes if present (`authDetails.scopes`).
7. Render a `<form>` that:
   - Uses `method="POST"` and `action="/api/oauth/decision"`.
   - Contains a hidden `<input>` with the `authorization_id`.
   - Has **two buttons**:
     - Approve → `name="decision" value="approve"`.
     - Deny → `name="decision" value="deny"`.

**UX constraints:**

- Keep styling minimal but readable (basic layout, headings, and spacing).
- Don’t introduce new UI libraries; use plain JSX + existing styles if the project has them.

---

### 2. Decision API route

**Create:**

- `app/api/oauth/decision/route.ts` (App Router API route)

**Implementation details:**

1. Export a `POST` handler using `NextResponse` from `next/server`.
2. Parse the incoming form data:
   - `authorization_id` (string, required).
   - `decision` (`"approve"` or `"deny"`).
   - If `authorization_id` is missing, return HTTP `400` with JSON `{ error: 'Missing authorization_id' }`.
3. Create a Supabase **server client** the same way as in the page:
   - Use `createServerClient` from `@supabase/ssr`.
   - Use `cookies` from `next/headers` and correctly wire `getAll` / `setAll`.
4. If `decision === "approve"`:
   - Call `supabase.auth.oauth.approveAuthorization(authorization_id)`.
5. If `decision !== "approve"` (treat anything else as deny):
   - Call `supabase.auth.oauth.denyAuthorization(authorization_id)`.
6. After calling either method:
   - If Supabase returns an error, respond with HTTP `400` and a JSON error payload.
   - If successful, Supabase returns an object with a `redirect_to` URL.
   - Use `NextResponse.redirect(redirect_to)` to redirect the browser to that URL.
7. The route must not render HTML; only redirect or JSON errors.

---

### 3. Env & wiring checks

- Ensure the code uses:
  - `process.env.NEXT_PUBLIC_SUPABASE_URL`
  - `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Do **not** hard-code Supabase URLs or project refs.
- If any of these env vars are missing, throw a clear error at runtime (or render an error saying Supabase is not configured).

---

### 4. Safety and robustness

- Handle all error paths:
  - Missing `authorization_id`.
  - Invalid `authorization_id` (Supabase error).
  - Supabase network or server errors.
- Show concise, user-friendly error messages on the consent page.
- Do not log secrets or tokens.

---

### 5. Acceptance criteria

- Visiting `/oauth/consent?authorization_id=<fake>`:
  - If user is not logged in → redirects to `/login?redirect=...`.
- When logged in and provided with a **valid** `authorization_id` (from Supabase test request):
  - The page shows client name and scopes.
  - Approving results in a redirect to the URL returned by Supabase.
  - Denying also redirects with the error information provided by Supabase.
- Code passes TypeScript checks and follows the project’s existing lint/prettier setup.

---

You (Codex) should locate the existing Next.js App Router entry (`app` directory), add these two routes, wire them with `@supabase/ssr`, and keep the implementation minimal and easy to read.
