# Copilot Instructions for notifiable-web

This is a **Next.js 16 + React 19** dashboard for the Notifiable notification platform. The frontend manages API keys, campaigns, templates, webhooks, and analytics.

## Architecture Overview

### Tech Stack

- **Framework**: Next.js 16 (App Router, `'use client'` for client components)
- **Language**: TypeScript (strict mode)
- **UI**: ShadCN UI + Radix UI primitives + TailwindCSS 4
- **Forms**: React Hook Form + Zod validation
- **API**: Axios + React Query 5 (Orval-generated clients from OpenAPI spec)
- **Auth**: Supabase (JWT-based, managed in `AuthContext`)
- **State**: Zustand stores + local React Context

### Data Flow

1. **Authentication** → `AuthContext` (Supabase session) → API token injected into `axios` interceptors
2. **API Calls** → Orval-generated clients (`src/api/generated/`) → Custom Axios instance (`src/api/http.ts`) with auto-refresh interceptors
3. **UI State** → React Query mutations/queries → Optimistic updates via `sonner` toast notifications
4. **Global UI State** → Zustand store (`src/auth/auth-store.ts`) for user/org selection

### Directory Structure

```
src/
├── app/                    # Next.js App Router pages & layouts
│   ├── dashboard/         # Protected dashboard route (subdirectories = route segments)
│   ├── auth/             # Public auth page
│   ├── layout.tsx        # Root layout with AuthProvider wrapping
│   └── providers.tsx     # QueryClientProvider + TooltipProvider setup
├── api/
│   ├── generated/        # Orval-generated API clients + schemas (DO NOT EDIT MANUALLY)
│   ├── http.ts          # Axios instance with interceptors
│   └── query-provider.tsx
├── components/
│   └── ui/              # ShadCN UI components (all from Radix primitives)
├── contexts/
│   └── AuthContext.tsx  # Supabase auth + org/env selection logic
├── hooks/               # Custom hooks (use-toast, use-mobile, use-lookups)
├── auth/
│   └── auth-store.ts    # Zustand store for JWT tokens + user state
├── utils/
    ├── api.ts           # Fallback API client (not used; see orval.config.ts)
    ├── types.ts         # Domain types (User, Org, Notification, Campaign, etc.)
    └── supabase/
        ├── info.ts      # Supabase project credentials
        └── server-client.ts # Server-side Supabase client with cookie handling
└── app/
    ├── oauth/
    │   └── consent/page.tsx       # OAuth consent screen (user approves/denies)
    └── api/oauth/
        └── decision/route.ts      # OAuth callback handler
```

## OAuth Flow for Client/Copilot

### Setup (One-time)

1. **Register OAuth App in Supabase**:
   - In Supabase Console → Authentication → Providers
   - Create OAuth app (configure as a custom provider or use existing one)
   - Set **Authorization Path** to `/oauth/consent`
   - Set **Site URL** to `http://localhost:3000` (dev) or your production domain

2. **Environment Variables**:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Client Registration**:
   - In your backend/Supabase OAuth Server, register the copilot client:
     - **Redirect URI**: `http://localhost:5555/oauth/callback` (adjust port for your copilot client)
     - **Scopes**: `openid profile email` (or custom scopes)
     - **Client ID/Secret**: Store in copilot's config

### Flow Steps

1. **Client Initiates Login**:
   - Copilot/MCP client redirects user to:
     ```
     https://your-app.com/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:5555/oauth/callback&scope=openid+profile+email&response_type=code
     ```
2. **Consent Screen** (`/oauth/consent`):
   - User sees permissions and clicks "Approve" or "Deny"
   - Frontend submits POST to `/api/oauth/decision` with `authorization_id`
   - API calls Supabase's `approveAuthorization()` or `denyAuthorization()`
   - Supabase returns `redirect_to` URL with authorization code

3. **Redirect Back to Client**:
   - Browser redirects to your copilot client's callback URL:
     ```
     http://localhost:5555/oauth/callback?code=AUTH_CODE&state=STATE
     ```
4. **Client Exchanges Code for Token**:
   - Copilot client calls backend `/oauth/token` endpoint:
     ```bash
     curl -X POST https://your-backend.com/oauth/token \
       -d "grant_type=authorization_code" \
       -d "code=AUTH_CODE" \
       -d "client_id=YOUR_CLIENT_ID" \
       -d "client_secret=YOUR_CLIENT_SECRET" \
       -d "redirect_uri=http://localhost:5555/oauth/callback"
     ```
   - Backend returns `access_token` (JWT) + `refresh_token`

5. **Client Stores Token**:
   - Save token in secure storage (e.g., `.codex/config.toml`)
   - Use for all subsequent API calls: `Authorization: Bearer <token>`

### Implementation References

| Component     | Location                              | Purpose                                         |
| ------------- | ------------------------------------- | ----------------------------------------------- |
| Consent UI    | `src/app/oauth/consent/page.tsx`      | Shows scopes & approve/deny buttons             |
| Decision API  | `src/app/api/oauth/decision/route.ts` | Handles form submission, calls Supabase         |
| Server Client | `src/utils/supabase/server-client.ts` | Creates Supabase server client with cookie auth |

### Error Handling

- **Invalid `authorization_id`**: Consent page shows error message
- **User not authenticated**: Redirects to `/login` with redirect parameter
- **Supabase error**: Returns 400 with error message
- All errors logged (check browser console or server logs)

## Key Workflows

### Adding a New Feature / Page

1. **Create folder** under `app/dashboard/[feature-name]` with `page.tsx` inside
2. **Page structure**: Use `'use client'` at top if it uses hooks, state, or auth
3. **Component pattern**: Extract into `components/` as reusable pieces
4. **API integration**: Use Orval-generated client or fallback `api.*` methods from `src/utils/api.ts`
5. **Forms**: Use `react-hook-form` + Zod schema from `src/api/generated/schemas/`
6. **Toast notifications**: Import `toast` from `sonner` (not the custom use-toast hook)

### Running & Building

```bash
pnpm dev              # Start dev server with Turbopack (port 3000)
pnpm build            # Build for production
pnpm openapi:fetch    # Fetch latest OpenAPI spec from backend
pnpm openapi:gen      # Re-generate Orval clients from spec
pnpm orval:watch      # Watch mode for Orval generation
pnpm lint             # Run ESLint
```

### API Code Generation

- **Config**: `orval.config.ts`
- **Spec**: `openapi.json` (fetched from backend via `scripts/fetch-openapi.mjs`)
- **Output**: Two clients generated:
  - `src/api/generated/notifiable.web.ts` (React Query hooks for client)
  - `src/api/generated/notifiable.server.ts` (Axios client for server actions)
- **Schemas**: Auto-generated in `src/api/generated/schemas/` (e.g., `createEventRequest.ts`)
- **Custom Mutator**: `src/api/http.ts` → Axios instance with JWT auto-refresh logic

## Critical Patterns & Conventions

### Authentication & Authorization

- **Auth state** lives in `AuthContext` (Supabase session) + `Zustand` store (`auth-store.ts`)
- **Protected routes**: `app/layout.tsx` redirects unauthenticated users to `/auth`
- **Org selection**: `selectedOrg` + `selectedEnv` (production/staging/dev) stored in context
- **Permissions**: Role-based checks in components (e.g., `AuditLogPage` checks `user?.role`)

### Form Validation & Submission

```typescript
// Pattern: Use react-hook-form + Zod schema
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createEventRequest } from '@/api/generated/schemas/createEventRequest';

const form = useForm({ resolver: zodResolver(createEventRequest), defaultValues: {} });
const onSubmit = async (data) => {
  try {
    await api.createEvent(data);
    toast.success('Event created');
  } catch (error) {
    toast.error('Failed to create event');
  }
};
```

### Component Naming & Structure

- **Page components** in `app/dashboard/*/page.tsx` export a default function
- **Reusable components** in `components/` or `features/`
- **UI primitives** from `components/ui/` (all ShadCN/Radix)
- **Custom hooks** in `hooks/` (e.g., `use-lookups`, `use-mobile`)
- **Dialog/Sheet for modals**: Use ShadCN UI `Dialog` + `DialogTrigger` pattern (see `APIKeysPage`, `TemplatesPage`)

### Styling

- **Utility-first**: TailwindCSS classes in JSX (e.g., `className="flex items-center justify-between gap-4"`)
- **Responsive**: Use `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` for mobile-first layouts
- **Colors**: Indigo for brand (`text-indigo-600`), neutral grays for text/borders
- **Spacing**: Consistent use of TW scale (gap-2, p-3, mb-4, etc.)

### State Management

- **URL state**: Use Next.js URL parameters (routes in `app/dashboard/`)
- **UI state**: React local `useState` for component-level (forms, modals, filters)
- **Global state**: Zustand store (`auth-store.ts`) for user/tokens + React Context for org selection
- **Server state**: React Query for API caching and sync

### Error Handling & Loading States

- **Loading**: Show `Skeleton` components (from ShadCN UI) during data fetch
- **Empty states**: Icon + message (e.g., in `NotificationsPage`)
- **Errors**: Catch in try-catch, call `toast.error(message)`, log to console
- **API errors**: Intercepted in `src/api/http.ts` with auto-refresh logic

## File Examples to Reference

| Pattern                      | File                                                    |
| ---------------------------- | ------------------------------------------------------- |
| Full-featured dashboard page | `src/app/dashboard/pages/NotificationsPage.tsx`         |
| Form with dialog             | `src/app/dashboard/pages/TemplatesPage.tsx`             |
| API integration              | `src/utils/api.ts` (fallback) or Orval-generated client |
| Auth flow                    | `src/contexts/AuthContext.tsx`                          |
| Custom hook                  | `src/hooks/use-lookups.tsx`                             |
| Reusable dialog component    | `src/components/ui/dialog.tsx` (from ShadCN)            |

## Constraints & Anti-Patterns

❌ **Avoid:**

- Server-side rendering for protected pages (use `'use client'` + `AuthContext` check)
- Fetching directly in effects without React Query (use generated hooks or `useQuery`)
- Global state for UI (use local state + URL params)
- Manual API client code (regenerate from OpenAPI spec via Orval)
- Hardcoded colors (use TW utility classes)
- Inline styles (`style={}`)

✅ **Do:**

- Type everything with TypeScript interfaces
- Use ShadCN UI components for consistency
- Export Zod schemas from form payloads for validation reuse
- Handle loading/error states visually
- Colocate state with components
- Use React Query for server state management

## Development Checklist

When creating a new page or component:

- [ ] Create TypeScript types in `src/utils/types.ts` or import from `src/api/generated/schemas/`
- [ ] Build form with `react-hook-form` + Zod validation
- [ ] Use ShadCN UI components for all interactive elements
- [ ] Handle loading state with `Skeleton` components
- [ ] Show empty state when no data
- [ ] Add error toasts on API failures
- [ ] Test responsive layout (mobile, tablet, desktop)
- [ ] Verify auth checks for permission-gated features
