# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Dev server (Turbopack, port 3000)
pnpm build            # Production build
pnpm lint             # ESLint (next/core-web-vitals + next/typescript)
pnpm orval            # Regenerate API hooks/schemas from openapi.json
pnpm openapi:gen      # Fetch latest OpenAPI spec + regenerate
```

## Architecture

**Next.js 16 App Router** with React 19, TypeScript strict mode, TailwindCSS 4, ShadCN UI (Radix primitives).

### Routing

- `/auth` — Public auth page (email/password + OAuth)
- `/dashboard/*` — Protected routes (guarded by AuthContext + middleware)
- `/api/auth/oauth/callback` — Supabase OAuth code exchange
- `/api/mcp/*` — MCP authorization code flow endpoints

### API Layer (Orval-generated)

OpenAPI spec lives at `openapi.json`. Orval generates two clients configured in `orval.config.ts`:

| Output | Client type | Mutator | Usage |
|--------|-------------|---------|-------|
| `src/api/generated/notifiable.web.ts` | `react-query` | `customAxios` | Client components (hooks) |
| `src/api/generated/notifiable.server.ts` | `axios` | `serverAxios` | Server-side calls |
| `src/api/generated/schemas/` | Zod DTOs | — | Shared types |

**Never edit files under `src/api/generated/`** — they are overwritten by `pnpm orval`.

**HTTP interceptors** (`src/api/http.ts`):
- Auto-injects `Authorization: Bearer {token}` and `x-Organization-Id` headers
- 401 auto-refresh interceptor (via `axios-auth-refresh`)
- Query params serialized with `qs` (comma array format)

`src/utils/api.ts` is a **legacy** mock client calling Supabase edge functions. Prefer generated hooks for all new work.

### Authentication

**Supabase** handles auth (JWT). Flow: sign-in → Supabase session → AuthContext hydrates tokens → synced to Zustand store (`src/auth/auth-store.ts`) + HTTP interceptors via `setHttpAuthTokens()`.

`AuthContext` (`src/contexts/AuthContext.tsx`) provides: `user`, `selectedOrg`, `selectedEnv`, `accessToken`, tokens, org/env switching. The `x-Organization-Id` header is injected automatically — hooks don't need to pass org ID for list/get endpoints.

Create/delete mutations that need org context pass `organizationId` in the request body (from `selectedOrg?.id`).

### State Management

- **React Query 5** — Server state (fetching, caching, invalidation via query keys)
- **Zustand** (`src/auth/auth-store.ts`) — Persists auth tokens for non-React code (interceptors)
- **React Context** (`AuthContext`) — Auth user, org selection, environment
- **Local state** — UI concerns (modals, forms, filters)

### Data Fetching Pattern

```tsx
// Query
const { data, isLoading } = useListSomethingEndpoint();

// Mutation with cache invalidation
const queryClient = useQueryClient();
const mutation = useSomeMutationEndpoint({
  mutation: {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListSomethingEndpointQueryKey() });
      toast.success('Done');
    },
  },
});
mutation.mutate({ data: { ... } });
```

## Conventions

- **UI components**: ShadCN UI from `src/components/ui/` (46 components). Use existing components before creating new ones.
- **Forms**: `react-hook-form` + Zod for validation.
- **Styling**: Tailwind utility classes only. Dark mode via CSS variables + `next-themes`.
- **Toasts**: `import { toast } from 'sonner'` — use `toast.success()` / `toast.error()`.
- **Icons**: `lucide-react`.
- **Types**: Use generated schema types from `@/api/generated/schemas` over manual interfaces in `src/utils/types.ts`.
- **Path alias**: `@/*` maps to `./src/*`.
- **Prettier**: 100 print width, single quotes, trailing commas, semicolons.

## Environment Variables

Key variables (see `.env.local`):
- `NEXT_PUBLIC_API_URL` — Backend API base URL (used by axios instance)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase auth
- `API_BASE_URL` — Server-side API override
- `OPENAPI_URL` — Swagger JSON URL for `openapi:fetch`
