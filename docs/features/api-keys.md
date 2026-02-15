# Feature: API Keys Management — Web Frontend

## Current State

The page at `/dashboard/api-keys` (`src/app/dashboard/api-keys/page.tsx`) exists but uses a **mock `ApiClient`** (`src/utils/api.ts`) that calls Supabase edge functions — not the real Notifiable API. It needs to be rewired to the actual backend endpoints now available:

| Backend Endpoint | Method | Purpose |
|-----------------|--------|---------|
| `POST /api/identity/api-keys` | Create | Returns raw key once |
| `GET /api/identity/api-keys` | List | All keys for org |
| `GET /api/identity/api-keys/{id}` | Get | Single key detail |
| `DELETE /api/identity/api-keys/{id}` | Revoke | Soft-delete (204) |

## What Needs to Change

### 1. Regenerate Orval API Client

The backend OpenAPI spec (`openapi.json`) must be updated to include the new `/api/identity/api-keys` endpoints, then regenerate:

```bash
pnpm orval
```

This will produce React Query hooks in `src/api/generated/notifiable.web.ts`:
- `useCreateApiKeyEndpoint()` — mutation
- `useListApiKeysEndpoint()` — query
- `useGetApiKeyEndpoint()` — query
- `useRevokeApiKeyEndpoint()` — mutation

And TypeScript schemas in `src/api/generated/schemas/`:
- `CreateApiKeyRequest` — `{ name, scopes, expiresAt? }`
- `CreateApiKeyResponse` — `{ id, rawKey, keyPrefix, name, scopes, createdAt, expiresAt }`
- `ApiKeyResponse` — `{ id, name, keyPrefix, scopes, createdAt, expiresAt, revokedAt, lastUsedAt, isActive }`

### 2. Rewrite the API Keys Page

Replace the current mock-based page with generated hooks. Key changes:

**Data fetching** — Replace `api.getApiKeys()` + `useState` + `useEffect` with:
```tsx
const { data, isLoading } = useListApiKeysEndpoint(
  { organizationId: selectedOrg?.id },
  { query: { enabled: !!selectedOrg?.id } }
);
```

**Create mutation** — Replace `api.createApiKey()` with:
```tsx
const createMutation = useCreateApiKeyEndpoint({
  mutation: {
    onSuccess: (data) => {
      setNewKeyRaw(data.rawKey); // Show once
      queryClient.invalidateQueries({ queryKey: listQueryKey });
      toast.success('API key created');
    },
  },
});
```

**Revoke mutation** — The current "Revoke" button is a no-op. Wire it:
```tsx
const revokeMutation = useRevokeApiKeyEndpoint({
  mutation: {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listQueryKey });
      toast.success('API key revoked');
    },
  },
});
```

### 3. Add Scope Selection to the Create Dialog

The current create dialog only asks for `name` and `environment`. It needs a **scopes multi-select** since the backend requires at least one scope:

**Available scopes:**
| Scope | Label | Description |
|-------|-------|-------------|
| `notifications:send` | Send Notifications | Send notifications via any channel |
| `audience:read` | Read Audience | List and view contacts and audiences |
| `audience:write` | Write Audience | Create, update, and delete contacts and audiences |
| `internal-notifications:read` | Read Internal Notifications | List and consume in-app notifications |

**UI approach:** Use a Checkbox group or multi-select with the 4 scopes. Pre-check `notifications:send` as the most common use case.

Remove the `environment` field — the backend doesn't have environment scoping on API keys (environment is a frontend-only concept for org switching).

### 4. Add Expiration Date Picker (Optional)

The backend supports `expiresAt`. Add an optional date picker to the create dialog:
- Default: no expiration
- Toggle: "Set expiration date" checkbox → shows date picker
- Validation: must be in the future

### 5. Update the Table Display

The current table shows columns that don't match the backend. Update:

| Column | Source field | Notes |
|--------|-------------|-------|
| Name | `name` | — |
| Key | `keyPrefix` | Show prefix with `...` suffix (e.g., `ntf_a1b2c3d4...`) |
| Scopes | `scopes` | Show as Badge chips |
| Status | `isActive` | Green "Active" or red "Revoked"/"Expired" badge |
| Created | `createdAt` | Formatted date |
| Last Used | `lastUsedAt` | "Never" if null |
| Actions | — | Copy prefix, Revoke button (disabled if already revoked) |

### 6. Add Revoke Confirmation Dialog

The "Revoke" button should show a confirmation dialog before calling DELETE:

```
Are you sure you want to revoke "{key.name}"?
This action cannot be undone. Any services using this key will immediately lose access.
[Cancel] [Revoke Key]
```

### 7. Update the Documentation Card

The bottom "Using the API" card shows `Authorization: Bearer YOUR_API_KEY`. Update it to show the correct header:

```bash
curl -X POST https://api.notifiable.io/api/notifications \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "channelType": "Internal",
    "recipients": { "userIds": ["..."] },
    "content": { "title": "Hello", "body": "World" }
  }'
```

### 8. Clean Up Dead Code

After rewiring, remove:
- `ApiKey` interface from `src/utils/types.ts` (use generated schema type)
- `getApiKeys()` and `createApiKey()` from `src/utils/api.ts`
- The `Environment` field from the create form

## Implementation Order

1. **Update `openapi.json`** with new endpoints (or re-export from backend swagger)
2. **Run `pnpm orval`** to regenerate hooks + schemas
3. **Rewrite page** with generated hooks, scope selector, revoke confirmation
4. **Update docs card** with correct `X-Api-Key` header example
5. **Clean up** dead types and mock API methods

## Files to Modify

| File | Change |
|------|--------|
| `openapi.json` | Add `/api/identity/api-keys` endpoints |
| `src/app/dashboard/api-keys/page.tsx` | Full rewrite with Orval hooks |
| `src/utils/types.ts` | Remove `ApiKey` interface |
| `src/utils/api.ts` | Remove `getApiKeys`, `createApiKey` methods |

## Notes

- The backend enforces **JWT-only** auth on management endpoints — API keys cannot manage themselves. This is transparent to the frontend since the user is always JWT-authenticated via Supabase.
- The `X-Organization-Id` header is already injected by the axios interceptor in `src/api/http.ts`, so the org context will work automatically.
- Role-based access (`OrgOwner`/`OrgManager`) is enforced server-side. The frontend can optionally hide the page for `OrgViewer` role using `selectedOrg.role`.
