# Notifiable Web

> A Next.js 16 + React 19 control plane for the Notifiable multi-tenant notifications platform, complete with Supabase authentication, Copilot MCP flows, typed API clients, and a ShadCN/Tailwind design system.

## Table of contents

1. [Overview](#overview)
2. [Feature highlights](#feature-highlights)
3. [Tech stack & tooling](#tech-stack--tooling)
4. [Application architecture](#application-architecture)
5. [Dashboard modules](#dashboard-modules)
6. [Authentication, OAuth & MCP flows](#authentication-oauth--mcp-flows)
7. [Environment & secrets](#environment--secrets)
8. [Development workflow](#development-workflow)
9. [Docker deployment](#docker-deployment)
10. [API generation workflow](#api-generation-workflow)
11. [Directory reference](#directory-reference)
12. [Data seeding & fixtures](#data-seeding--fixtures)
13. [Documentation index](#documentation-index)
14. [Conventions & checklists](#conventions--checklists)
15. [Known gaps & follow-ups](#known-gaps--follow-ups)

---

## Overview

The **Notifiable Web** application is the front-end for managing the Notifiable platform-an opinionated notifications service with organizations, multichannel delivery (email, SMS, push, internal), campaigns, templates, audiences, webhooks, API keys, and analytics. The app targets engineers who need to:

- Operate customer-facing notifications features through a secure dashboard.
- Run Supabase-backed authentication (email/password, Supabase OAuth providers, and Model Context Protocol flows that authorize GitHub Copilot / other MCP clients).
- Interact with FastEndpoints/Codex APIs via a generated, typed SDK (`src/api/generated`).
- Maintain consistency with internal product guidelines documented in `AGENTS.md`, `.github/copilot-instructions.md`, and multiple MCP/OAuth playbooks living in the repo.

At the root (`src/app/page.tsx`) the app currently renders a generated MCP login URL for the `copilot-mcp-client` client-useful when debugging the OAuth dance manually.

---

## Feature highlights

- **Multi-tenant Supabase auth**: `src/contexts/AuthContext.tsx` wires Supabase sessions, token exchange, organization selection, environment toggles (production/staging/dev), access/refresh token rotation, and consent operations for MCP OAuth.
- **Copilot MCP integration**: `/auth/mcp/authorize`, `/api/mcp/authorize`, `/api/mcp/token`, and `/api/mcp/client/[clientId]` implement the authorization-code flow over Supabase tables (`mcp_clients`, `mcp_authorizations`, `mcp_refresh_tokens`). `generateMCPLoginUrl` (see `src/utils/mcp-auth.ts`) builds the authorization URL Copilot clients consume.
- **Typed, React Query powered API access**: `openapi.json` + `orval.config.ts` produce `src/api/generated/notifiable.web.ts` (React Query hooks) and `notifiable.server.ts` (axios client). `src/api/http.ts` centralizes headers, org scoping, and refresh interceptors via `axios-auth-refresh`.
- **Rich dashboard UX**: `src/app/dashboard` provides segments for overview analytics, notifications CRUD, campaigns, templates, providers, webhooks, API keys, reporting, health, recipients, audiences, audit, and settings-all wrapped in a responsive `DashboardLayout`.
- **ShadCN / Radix UI system**: `src/components/ui` contains all design primitives (Accordion, Dialog, Sheet, Table, Command palette, etc.) themed by `tailwind.config.ts` (Tailwind 4).
- **Data visualization**: `src/app/dashboard/overview/page.tsx` renders KPIs, stacked area charts, pie charts, and provider health badges with `recharts`.
- **Notification operations tooling**: `src/app/dashboard/notifications/**` includes table filters, pagination, unread toggles, detail sheets, and a `NotificationCreateDialog` that supports inline or template-based content, multi-channel targeting, metadata, scheduling (`notBefore`), and correlation IDs.
- **Documentation-first project**: dozens of MCP/OAuth/setup docs (see [Documentation index](#documentation-index)) plus `.github/copilot-instructions.md` and `AGENTS.md` encode the expected engineering workflow, style, and authentication playbooks.

---

## Tech stack & tooling

- **Framework**: Next.js 16 (App Router) + React 19 (client components via `'use client'`).
- **Language**: TypeScript (strict config, path alias `@/*` in `tsconfig.json`).
- **Styling**: TailwindCSS 4 (`tailwind.config.ts`) + `tailwindcss-animate` for motion, `clsx`/`tailwind-merge` helper (`src/lib/utils.ts`).
- **UI primitives**: ShadCN UI copies in `src/components/ui`, Radix primitives, `lucide-react` icons, `sonner` + ShadCN toast wrappers, `cmdk`, `embla-carousel`.
- **Forms & validation**: `react-hook-form` and `zod` are installed (to be used for every new form per `AGENTS.md`).
- **State & data**: `@tanstack/react-query` (with devtools), `zustand` store at `src/auth/auth-store.ts`, React Context for auth/org env, light local component state.
- **Networking**: `axios` with `axios-auth-refresh`, `qs` serializer, custom interceptors in `src/api/http.ts`.
- **Auth**: Supabase client (`@supabase/supabase-js`, `@supabase/ssr`) plus OAuth utilities in `src/utils/oauth-client.ts`.
- **Data viz**: `recharts`.
- **Notifications**: In-app `sonner` toasts, `Badge` statuses.
- **Tooling**: ESLint Flat config, Prettier, Turbopack (`npm run dev`/`build`), Orval for SDK generation, `scripts/fetch-openapi.mjs` for pulling swagger.

---

## Application architecture

### App shell & routing

- `src/app/layout.tsx` wraps **everything** in `<Providers />` (QueryClient + tooltip + two toasters) and `<AuthProvider />`, guarding private routes; while loading, a spinner screen is shown. It also enforces redirect-to-`/auth` for non-public routes.
- `src/app/providers.tsx` is the single source of truth for React Query and tooltip/toast providers.
- `src/middleware.ts` wires a Supabase SSR client to refresh cookies, logging cookie names for debugging and applying to every route except `_next` assets.
- `src/app/api/**` hosts Next.js Route Handlers for Supabase OAuth callbacks and MCP flows (see dedicated section).

### Authentication & organization management

- `src/contexts/AuthContext.tsx` integrates Supabase sessions, React Query for `useListOrganizationsEndpoint`, token hydration, organization/environment selection, and exposes helpers (`signIn`, `signUp`, `signOut`, `selectOrg`, `setEnvironment`, `setTokens`, `isAccessExpired`, `secondsToExpiry`). It keeps axios interceptors (`setHttpAuthTokens`) synchronized and fetches authorization details for consent screens via Supabase's admin OAuth helpers.
- `src/auth/auth-store.ts` (Zustand) persists raw tokens/roles for non-React usage; `useAuthHasHydrated()` reports readiness.
- `src/app/auth/page.tsx` renders a tabbed sign-in/sign-up form plus the `OAuthLoginButton` (which uses `initiateSupabaseOAuth` and environment variables). Query parameters `?redirect` or `?mcp=true` are preserved post-login.
- `src/app/auth/mcp/authorize/page.tsx` is the consent UI for MCP clients. It loads client metadata via `/api/mcp/client/[clientId]`, handles approvals/denials, and redirects with codes/state.
- `src/utils/oauth-client.ts` contains the OAuth login helper, callback parsing hook (`useOAuthCallback`), and `exchangeCodeForSession` helper to call `/api/auth/oauth/callback`.
- `src/app/api/auth/oauth/callback/route.ts` exchanges Supabase auth codes using the **service role key** and sets secure access/refresh cookies for the browser client.

### API layer

- `openapi.json` (checked in) is the canonical Notifiable API schema. Fetch updates with `npm run openapi:fetch` (`scripts/fetch-openapi.mjs` hits `OPENAPI_URL`, tolerating self-signed certs) and regenerate clients with `npm run openapi:gen`.
- `orval.config.ts` produces:
  - `src/api/generated/notifiable.web.ts` - React Query hooks using `customAxios` (client-side, handles automatic Authorization / org headers and refresh logic).
  - `src/api/generated/notifiable.server.ts` - thin axios client hitting the same base URL (useful for server actions).
  - `src/api/generated/schemas/**` - Zod schemas/DTO typings.
- `src/api/http.ts` exports `customAxios`, `serverAxios`, and `setHttpAuthTokens`. It builds interceptors that inject tokens and `x-Organization-Id` headers, and defines a placeholder refresh logic (to be wired to a real refresh endpoint).
- `src/utils/api.ts` remains as a fallback REST client targeting the Supabase Edge Function `functions/v1/make-server-6ccce88d` for legacy calls (notifications, campaigns, templates, analytics, seeding).

### State & interaction patterns

- React Query manages server state (auth/organizations, lookups, notifications, etc.), with caching and controlled invalidation (`queryClient.removeQueries` in the auth provider).
- Local React state handles UI (filters, modals, forms). `NotificationCreateDialog` currently uses controlled inputs; future forms should migrate to `react-hook-form` + Zod.
- Toasts: `sonner` for notifications, plus ShadCN's `Toaster` component in `src/components/ui/sonner`.
- Hooks: `src/hooks/use-lookups.tsx` fetches lookup sets via generated `useGetMultiLookupValuesEndpoint`; `use-mobile` handles responsive checks; `use-toast.ts` implements toast wrappers.

### UI system

- `src/components/ui/*` contains every ShadCN port (Accordion, AlertDialog, Button, Dialog, Drawer, Form, Sheet, Select, Table, Tabs, Tooltip, etc.). Each component is typed and uses Tailwind classes defined in `tailwind.config.ts`.
- `src/components/oauth-login-button.tsx` composes a Button icon + Supabase OAuth action.
- `src/components/ui/sidebar.tsx` (and others) power the dashboard layout.
- `src/lib/utils.ts` exposes `cn` plus date formatting helpers.

---

## Dashboard modules

All dashboard routes live under `src/app/dashboard`, share `DashboardLayout`, and are client components guarded by auth:

- **Layout (`layout.tsx`)**: renders the sidebar nav, environment/organization switchers, user dropdown, and an optional "Generate Demo Data" banner (calls `api.seedData()` once per browser via the `notifiable-seeded` flag in `localStorage`).
- **Overview (`overview/page.tsx`)**: pulls `api.getAnalyticsOverview` to display KPI cards (total sent, success rate, latency, incidents), stacked area chart (delivered/failed/pending), channel distribution pie chart, and provider health badges with `Badge`.
- **Notifications (`notifications/*`)**:
  - `page.tsx` fetches notifications for the current user via `listInternalNotificationsEndpoint`, maintains filters (`status/channel/search/unreadOnly`), pagination, and selection state. Viewing a notification opens `NotificationDetailsSheet`; creating uses `NotificationCreateDialog`.
  - `components/NotificationsList.tsx` renders filter controls and a paginated table with status badges, typed columns, and skeleton placeholders.
  - `NotificationCreateDialog.tsx` fetches contacts (`listContactsEndpoint`), audiences (`listAudiencesEndpoint`), templates (`getTemplateListEndpoint`), builds `RecipientSet` payloads, optional inline content, metadata JSON parsing, scheduling, and calls `enqueueNotificationEndpoint`.
  - `NotificationDetailsSheet.tsx` displays metadata with a JSON viewer; hooking up `getNotificationStatusEndpoint` is stubbed (see [Known gaps](#known-gaps--follow-ups)).
- **Other route placeholders**: directories exist for `campaigns`, `templates`, `audiences`, `recipients`, `providers`, `webhooks`, `api-keys`, `reporting`, `health`, `settings`, and `audit-log`. These modules align with the `navigation` array in `DashboardLayout` and inherit the same guard/state management, ready for future implementation.

---

## Authentication, OAuth & MCP flows

### Supabase email/password + OAuth

1. User lands on `/auth` (see `src/app/auth/page.tsx`).
2. They can sign in/up via Supabase auth (handled in `AuthContext.signIn/signUp`, which calls Supabase's password APIs and `api.signup` for organization provisioning).
3. Alternatively, they click `OAuthLoginButton`, which redirects to Supabase's OAuth authorize endpoint using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_OAUTH_REDIRECT_URI`.
4. After third-party approval, Supabase redirects back with a `code`. The frontend posts to `/api/auth/oauth/callback`, which exchanges the code with `createClient(...SUPABASE_SERVICE_ROLE_KEY...)`, sets secure cookies, and returns success.
5. `AuthContext` listens for session changes via `supabase.auth.onAuthStateChange`, hydrates tokens, and populates org/environment context, plus React Query caches for organizations.

### MCP authorization-code flow

1. An MCP client (e.g., GitHub Copilot) generates an auth link via `generateMCPLoginUrl(appUrl, clientId, redirectUri, clientName)` or `buildMCPAuthUrl`.
2. The human user is redirected to `/auth/mcp/authorize?client_id=...&redirect_uri=...&scope=...&state=...`. If unauthenticated, they bounce through `/auth?mcp=true&...`.
3. `/auth/mcp/authorize/page.tsx` loads the MCP client record via `/api/mcp/client/[clientId]` and shows the consent screen (scopes, warning, user info).
4. Approving calls `/api/mcp/authorize` which:
   - Validates the client against `mcp_clients` (Supabase table).
   - Verifies redirect URIs.
   - Inserts an authorization code row in `mcp_authorizations` (10-minute expiry).
5. The browser redirects back to the MCP client's callback with `code` and optional `state`.
6. The MCP client exchanges the code by POSTing to `/api/mcp/token` with `grant_type=authorization_code`. The route validates client credentials, checks `mcp_authorizations`, fetches Supabase user data, signs a JWT (HS256, `JWT_SECRET`), stores a hashed refresh token in `mcp_refresh_tokens`, marks the authorization as used, and returns `access_token`, `refresh_token`, TTL, and scopes.
7. Tokens are used for subsequent API calls with `Authorization: Bearer`.

### Supporting SQL / docs

- `docs/MCP_MIGRATION.sql` contains the Supabase schema needed for `mcp_clients`, `mcp_authorizations`, and `mcp_refresh_tokens`.
- Detailed instructions live in `MCP_IMPLEMENTATION_COMPLETE.md`, `MCP_SUMMARY.md`, `MCP_VISUAL_GUIDE.md`, `START_HERE_MCP.md`, `MCP_QUICK_START.md`, and `MCP_SERVER_SETUP.md`.

---

## Environment & secrets

Create `.env.local` (already gitignored) with the following keys:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. Used client-side by Supabase JS/OAuth flows. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key. Also embedded in `src/utils/supabase/info.tsx` (auto-generated). |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for server routes (`/api/auth/oauth/callback`, `/api/mcp/*`). **Keep secret.** |
| `NEXT_PUBLIC_OAUTH_REDIRECT_URI` | Frontend URL that Supabase redirects to after third-party OAuth (consumed by `OAuthLoginButton`). |
| `NEXT_PUBLIC_API_URL` | Base URL for axios (`customAxios`). |
| `API_BASE_URL` (optional) | Server-side base URL override for `serverAxios`. |
| `OPENAPI_URL` | Source URL for `npm run openapi:fetch` (`scripts/fetch-openapi.mjs`). Defaults to `https://localhost:7119/swagger/notifiable-api/swagger.json`. |
| `JWT_SECRET` | Secret used by `/api/mcp/token` when signing MCP access tokens. |
| `NEXT_PUBLIC_APP_URL` (if set) | Useful when constructing MCP links outside of components. |

Supabase project metadata (projectId + anon key) is kept in `src/utils/supabase/info.tsx` for build-time usage; regenerate it from secure tooling rather than editing manually.

---

## Development workflow

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts Next.js dev server with Turbopack on port 3000. |
| `npm run build` | Production build (Turbopack). |
| `npm run start` | Runs the production build. |
| `npm run lint` | ESLint (Flat config) across the repo. |
| `npm run openapi:fetch` | Downloads the latest OpenAPI spec to `openapi.json`. |
| `npm run openapi:gen` | Fetch + regenerate Orval clients (web + server). |
| `npm run orval` / `npm run orval:watch` | Generate Orval clients once or watch mode. |

> The project uses a `pnpm-lock.yaml` but scripts run fine through `npm` or `pnpm`. Stay consistent with your package manager.

### Running locally

1. Copy `.env.local.example` (if available) or populate `.env.local` with the variables listed above.
2. Install deps: `npm install` (or `pnpm install`).
3. Start `npm run dev`.
4. Supabase edge functions (`/functions/v1/make-server-6ccce88d`) must be reachable for legacy endpoints; the generated API client uses whatever `servers[].url` is defined inside `openapi.json`.

---

## Docker deployment

The project includes a multi-stage Dockerfile optimized for production with Next.js standalone output.

### Build arguments (NEXT_PUBLIC_* variables)

These are baked into the JavaScript bundle at build time and exposed to the browser:

| Argument | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL for the API (e.g., `https://api.notifiable.com`) |
| `NEXT_PUBLIC_SUPABASE_PROJECTID` | Supabase project ID |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key |

### Runtime environment variables

These are server-side only and never exposed to the browser:

| Variable | Description |
| --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (secret) |
| `JWT_SECRET` | Secret for signing MCP access tokens |
| `API_BASE_URL` | Server-side API base URL override |

### Building the Docker image

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.example.com \
  --build-arg NEXT_PUBLIC_SUPABASE_PROJECTID=your-project-id \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key \
  -t notifiable-web .
```

### Running the container

```bash
# Basic run
docker run -p 3000:3000 notifiable-web

# With runtime environment variables
docker run -p 3000:3000 \
  -e SUPABASE_SERVICE_ROLE_KEY=your-secret-key \
  -e JWT_SECRET=your-jwt-secret \
  notifiable-web

# Using an env file
docker run -p 3000:3000 --env-file .env.production notifiable-web
```

### Deploying with Dokploy

1. **Build Arguments**: Go to your application → **Advanced** → **Build Args** and add all `NEXT_PUBLIC_*` variables.

2. **Environment Variables**: Go to your application → **Environment** and add server-side secrets (`SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, etc.).

3. **Port**: The container exposes port `3000` by default.

> The Dockerfile uses Node 22 Alpine, pnpm, and runs as a non-root user for security.

---

## API generation workflow

1. Update backend swagger: `npm run openapi:fetch` (or set `OPENAPI_URL` to point at the correct environment).
2. Regenerate clients: `npm run openapi:gen`. This runs `orval` twice per `orval.config.ts`.
3. Commit changes under `src/api/generated/**` and `openapi.json`. **Never edit generated files manually.**
4. The React Query client expects `customAxios` to handle base URLs; ensure the `servers` section in the OpenAPI doc is correct to avoid undefined endpoints.

---

## Directory reference

| Path | Description |
| --- | --- |
| `src/app` | Next.js App Router tree (layouts, pages, providers, API routes). Subfolders: `auth`, `auth/mcp`, `dashboard`, `oauth` (if added), `api`. |
| `src/app/dashboard/*` | Route segments for overview, notifications, campaigns, templates, etc. Each folder typically contains `page.tsx` plus `components/`. |
| `src/app/api` | Route handlers for Supabase OAuth callback (`api/auth/oauth/callback`) and MCP endpoints (`api/mcp/*`). |
| `src/components` | Global UI components; `components/ui` holds all ShadCN-derived primitives plus wrappers (`sonner`, tables, dialogs, command palette, etc.). |
| `src/contexts` | React contexts (`AuthContext`). |
| `src/auth` | Zustand store (`auth-store.ts`), client guards, API hooks. |
| `src/utils` | Helper modules: `api.ts`, `mcp-auth.ts`, `oauth-client.ts`, domain `types.ts`, `supabase` client info/server helper. |
| `src/api` | HTTP helpers plus generated SDKs + schemas. |
| `src/features` | Feature-scoped hooks/components (e.g., `features/user/*`). |
| `src/hooks` | Reusable hooks such as `use-lookups`, `use-mobile`, and toast helpers. |
| `src/lib` | Generic utilities (`cn`, date formatting). |
| `docs/` | Supplemental MCP + OAuth documentation, SQL migrations, and setup guides. |
| `.github/copilot-instructions.md` | Extended engineering playbook for Copilot agents (architecture, flows, checklists). |
| `AGENTS.md` | Defines the `web-engineer` persona, allowed tools, and guardrails (React Hook Form, Zod, Tailwind, etc.). |
| `scripts/fetch-openapi.mjs` | Helper script to download swagger specs (accepts overrides via `OPENAPI_URL`). |

---

## Data seeding & fixtures

- `DashboardLayout` exposes a **Generate Demo Data** button (visible until `localStorage['notifiable-seeded']` exists). Clicking it calls `api.seedData(orgId)` against the Supabase Edge Function, then prompts you to browse to Notifications to view fake data.
- Notification list fallback mapping uses `crypto.randomUUID()` to fill missing IDs, ensuring UI stability even if records are partially populated.
- `NotificationCreateDialog` restricts recipient selection to 100 contacts/audiences per page (see `CONTACT_PAGE_SIZE` / `TEMPLATE_PAGE_SIZE` constants); adjust as needed when real pagination endpoints are wired.

---

## Documentation index

| File | Summary |
| --- | --- |
| `AGENTS.md` | Defines the `web-engineer` agent: expert React/Next/TypeScript engineer expected to use React Hook Form, Zod, and Tailwind while keeping UI accessible and component-driven. Includes allowed CLI commands. |
| `.github/copilot-instructions.md` | Deep dive into architecture, OAuth flow, directory structure, conventions, API client generation, component patterns, and a development checklist specifically for Copilot/agents. |
| `START_HERE_MCP.md` | Onboarding doc explaining how to bootstrap the MCP experience (read before diving into implementation). |
| `MCP_IMPLEMENTATION_COMPLETE.md`, `MCP_SUMMARY.md`, `MCP_VISUAL_GUIDE.md`, `MCP_IMPLEMENTATION_INDEX.md`, `MCP_IMPLEMENTATION_COMPLETE.md`, `MCP_VISUAL_GUIDE.md` | Exhaustive artifacts documenting the MCP implementation, inventories, visual diagrams, and completion checklists. |
| `MCP_QUICK_START.md`, `MCP_SERVER_SETUP.md` | Focused guides for spinning up the MCP server pieces, including Supabase configuration and endpoint wiring. |
| `docs/MCP_MIGRATION.sql` | SQL to add MCP tables (`mcp_clients`, `mcp_authorizations`, `mcp_refresh_tokens`) into Supabase. |
| `docs/MCP_QUICK_START.md`, `docs/MCP_SERVER_SETUP.md` | Step-by-step instructions for local MCP development environments. |
| `docs/OAUTH_CLIENT_SETUP.md`, `docs/OAUTH_IMPLEMENTATION_SUMMARY.md`, `docs/OAUTH_IMPLEMENTATION_INDEX.md`, `docs/OAUTH_IMPLEMENTATION_COMPLETE.md`, `docs/OAUTH_IMPLEMENTATION_INVENTORY.md`, `docs/OAUTH_QUICK_REFERENCE.md`, `docs/OAUTH_VISUAL_SUMMARY.md`, `oauth_instructions.md` | Everything related to OAuth acquisition, client registration, and historical decisions. |
| `SETUP_COMPLETE.md`, `MCP_IMPLEMENTATION_COMPLETE.md`, `START_HERE_MCP.md` | Additional onboarding artifacts highlighting what's configured vs pending. |

Leverage these docs before modifying auth flows-most questions have already been answered there.

---

## Conventions & checklists

The project encodes several expectations (from `AGENTS.md` and `.github/copilot-instructions.md`):

- **Always type components**: Define props/interfaces for every component.
- **Forms**: Use `react-hook-form` + Zod schemas generated from `src/api/generated/schemas` (or domain-specific ones).
- **Component-driven architecture**: Promote reusability by colocating UI under `components/` or `features/`.
- **Styling**: Tailwind utility classes with the project palette (avoid inline styles or arbitrary colors).
- **State management**: Keep global state minimal-prefer React Query for server data, React context for auth/org, Zustand only when necessary.
- **Error handling**: Display skeletons/spinners while loading, empty states when no records, and toast notifications on success/failure.
- **API usage**: Prefer the generated Orval hooks; avoid handwritten fetchers unless calling Supabase functions (`src/utils/api.ts`).
- **Code quality**: Run `npm run lint` before commits; keep code ASCII unless necessary; follow Prettier formatting.
- **MCP/OAuth**: Follow the flows documented above; do not bypass Supabase-managed consent/authorization storage.

---

## Known gaps & follow-ups

- **Notification detail fetch**: `viewNotification` in `src/app/dashboard/notifications/page.tsx` has a commented-out call to `getNotificationStatusEndpoint`. Wire it to display real details in `NotificationDetailsSheet`.
- **React Hook Form adoption**: `NotificationCreateDialog` and other forms currently use manual `useState`; migrate them to `react-hook-form` + Zod (per `AGENTS.md`) for validation and type safety.
- **Generated client naming**: Some hooks (e.g., `useGetUserProfileEndpoint`, `useGetMultiLookupValuesEndpoint`) still reference `teammate.web` outputs. Update the OpenAPI spec / Orval config if the Notifiable backend has equivalent endpoints.
- **Home page placeholder**: `src/app/page.tsx` renders only the MCP login URL. Replace it with a meaningful landing or redirect once the dashboard is the main entry point.
- **Token refresh logic**: `src/api/http.ts` contains a stubbed refresh implementation (commented call to `getNotifiableAPI().jwtTokenService`). Implement the actual refresh endpoint once available.

---

Need something else? Check the linked docs first, then explore `src/app/dashboard` to continue building modules like campaigns, templates, providers, and reporting. Pull requests should update this README anytime core behaviors or dependencies change.
