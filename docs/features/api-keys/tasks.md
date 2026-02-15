# API Keys Page — Implementation Tasks

Each task below is self-contained and should be implemented in order. All generated Orval hooks and schemas already exist — no code generation step is needed.

---

## Task 1: Rewrite page data fetching with `useListApiKeysEndpoint`

**File:** `src/app/dashboard/api-keys/page.tsx`

**What to do:**
- Remove all imports from `../../../utils/api` (the mock `api` client)
- Remove the `ApiKey` and `Environment` type imports from `../../../utils/types`
- Remove the `useState<ApiKey[]>` / `useEffect` / `loadKeys()` manual fetch pattern
- Import and use the generated hook instead:
  ```tsx
  import { useListApiKeysEndpoint, getListApiKeysEndpointQueryKey } from '@/api/generated/notifiable.web';
  import type { ApiKeyResponse } from '@/api/generated/schemas';
  ```
- Replace loading/data state with:
  ```tsx
  const { data: keys, isLoading } = useListApiKeysEndpoint();
  ```
- The hook requires no parameters — the `X-Organization-Id` header is injected automatically by the axios interceptor in `src/api/http.ts`.
- Replace `loading` references with `isLoading`, and `keys` array with `keys ?? []`.
- Remove `selectedEnv` from the `useAuth()` destructure (no longer needed on this page).
- Keep `selectedOrg` from `useAuth()` — it's needed for the org context guard and create mutation.

---

## Task 2: Wire up the Create API Key mutation

**File:** `src/app/dashboard/api-keys/page.tsx`

**What to do:**
- Import `useCreateApiKeyEndpoint` from `@/api/generated/notifiable.web`
- Import `useQueryClient` from `@tanstack/react-query`
- Import `CreateApiKeyRequest`, `CreateApiKeyResponse` from `@/api/generated/schemas`
- Replace the `newKey` state type from `ApiKey | null` to `CreateApiKeyResponse | null`
- Set up the mutation:
  ```tsx
  const queryClient = useQueryClient();
  const createMutation = useCreateApiKeyEndpoint({
    mutation: {
      onSuccess: (data) => {
        setNewKey(data);
        queryClient.invalidateQueries({ queryKey: getListApiKeysEndpointQueryKey() });
        toast.success('API key created');
      },
      onError: () => {
        toast.error('Failed to create API key');
      },
    },
  });
  ```
- Replace the `createKey` form handler to call the mutation:
  ```tsx
  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    // scopes from Task 3's checkbox state
    createMutation.mutate({
      data: {
        name,
        scopes: selectedScopes,
        organizationId: selectedOrg?.id,
        expiresAt: expiresAt ?? undefined, // from Task 4
      },
    });
  }
  ```
- In the "API Key Created" success view, change `newKey.key` to `newKey.rawKey` (the generated schema field name).
- Disable the "Create Key" submit button while `createMutation.isPending`.

---

## Task 3: Add scope selection to the Create dialog

**File:** `src/app/dashboard/api-keys/page.tsx`

**What to do:**
- Add a `selectedScopes` state: `useState<string[]>(['notifications:send'])`
- Remove the Environment `<Select>` field entirely (backend has no environment scoping on API keys).
- Remove the `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` imports if no longer used elsewhere in this file.
- Import `Checkbox` from `@/components/ui/checkbox`.
- Add a scopes section to the create form, below the name input:
  ```tsx
  <div className="space-y-2">
    <Label>Scopes</Label>
    <div className="space-y-2">
      {AVAILABLE_SCOPES.map((scope) => (
        <label key={scope.value} className="flex items-center gap-2">
          <Checkbox
            checked={selectedScopes.includes(scope.value)}
            onCheckedChange={(checked) => {
              setSelectedScopes((prev) =>
                checked
                  ? [...prev, scope.value]
                  : prev.filter((s) => s !== scope.value)
              );
            }}
          />
          <div>
            <span className="text-sm font-medium">{scope.label}</span>
            <p className="text-xs text-gray-500">{scope.description}</p>
          </div>
        </label>
      ))}
    </div>
  </div>
  ```
- Define the scopes constant at module level (outside the component):
  ```tsx
  const AVAILABLE_SCOPES = [
    { value: 'notifications:send', label: 'Send Notifications', description: 'Send notifications via any channel' },
    { value: 'audience:read', label: 'Read Audience', description: 'List and view contacts and audiences' },
    { value: 'audience:write', label: 'Write Audience', description: 'Create, update, and delete contacts and audiences' },
    { value: 'internal-notifications:read', label: 'Read Internal Notifications', description: 'List and consume in-app notifications' },
  ] as const;
  ```
- Disable the "Create Key" button if `selectedScopes.length === 0` (backend requires at least one scope).
- Reset `selectedScopes` to `['notifications:send']` when the dialog closes.

---

## Task 4: Add optional expiration date picker

**File:** `src/app/dashboard/api-keys/page.tsx`

**What to do:**
- Add state: `const [hasExpiration, setHasExpiration] = useState(false)` and `const [expiresAt, setExpiresAt] = useState<string | null>(null)`
- Add to the create form, below scopes:
  ```tsx
  <div className="space-y-2">
    <label className="flex items-center gap-2">
      <Checkbox
        checked={hasExpiration}
        onCheckedChange={(checked) => {
          setHasExpiration(!!checked);
          if (!checked) setExpiresAt(null);
        }}
      />
      <span className="text-sm font-medium">Set expiration date</span>
    </label>
    {hasExpiration && (
      <Input
        type="date"
        min={new Date().toISOString().split('T')[0]}
        value={expiresAt ?? ''}
        onChange={(e) => setExpiresAt(e.target.value || null)}
        required
      />
    )}
  </div>
  ```
- Pass `expiresAt` as an ISO string to the create mutation (convert from date input if set): `expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined`
- Reset `hasExpiration` and `expiresAt` when dialog closes.

---

## Task 5: Update the keys table to match backend schema

**File:** `src/app/dashboard/api-keys/page.tsx`

**What to do:**
- Update the table headers to: Name | Key | Scopes | Status | Created | Last Used | Actions
- Update each `<TableRow>` to render `ApiKeyResponse` fields:
  - **Name**: `key.name`
  - **Key**: `key.keyPrefix` with `...` suffix, e.g. `{key.keyPrefix}...`
  - **Scopes**: Render each scope as a `<Badge variant="outline">` chip. Map scope values to short labels (e.g. `notifications:send` → `Send`).
  - **Status**: Conditional badge:
    - If `key.isActive` → `<Badge className="bg-green-100 text-green-800">Active</Badge>`
    - If `key.revokedAt` → `<Badge variant="destructive">Revoked</Badge>`
    - Else (expired) → `<Badge variant="secondary">Expired</Badge>`
  - **Created**: `new Date(key.createdAt).toLocaleDateString()`
  - **Last Used**: `key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'`
  - **Actions**: Copy prefix button + Revoke button (disabled if `!key.isActive`)
- Remove `Eye`/`EyeOff` from lucide imports (no longer used — keys aren't shown in full).
- The copy button should copy `key.keyPrefix` (the only part available after creation).

---

## Task 6: Wire up the Revoke mutation with confirmation dialog

**File:** `src/app/dashboard/api-keys/page.tsx`

**What to do:**
- Import `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogTitle` from `@/components/ui/alert-dialog`.
- Import `useRevokeApiKeyEndpoint` from `@/api/generated/notifiable.web`.
- Add state: `const [revokeTarget, setRevokeTarget] = useState<ApiKeyResponse | null>(null)`
- Set up the revoke mutation:
  ```tsx
  const revokeMutation = useRevokeApiKeyEndpoint({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListApiKeysEndpointQueryKey() });
        toast.success('API key revoked');
        setRevokeTarget(null);
      },
      onError: () => {
        toast.error('Failed to revoke API key');
      },
    },
  });
  ```
- Change the Revoke button in the table row to: `onClick={() => setRevokeTarget(key)}`, disabled if `!key.isActive`.
- Add the confirmation dialog (outside the table, inside the main return):
  ```tsx
  <AlertDialog open={!!revokeTarget} onOpenChange={(open) => !open && setRevokeTarget(null)}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to revoke "{revokeTarget?.name}"?
          This action cannot be undone. Any services using this key will immediately lose access.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={() => {
            if (revokeTarget?.id) {
              revokeMutation.mutate({
                id: revokeTarget.id,
                data: { organizationId: selectedOrg?.id },
              });
            }
          }}
          disabled={revokeMutation.isPending}
          className="bg-red-600 hover:bg-red-700"
        >
          Revoke Key
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  ```

---

## Task 7: Update the documentation card

**File:** `src/app/dashboard/api-keys/page.tsx`

**What to do:**
- Replace the "Using the API" card's curl examples with the correct header and endpoint:
  - **Send a notification:**
    ```
    curl -X POST https://api.notifiable.io/api/notifications \
      -H "X-Api-Key: YOUR_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "channelType": "Internal",
        "recipients": { "userIds": ["..."] },
        "content": { "title": "Hello", "body": "World" }
      }'
    ```
  - **Check notification status:**
    ```
    curl https://api.notifiable.io/api/notifications/:id \
      -H "X-Api-Key: YOUR_API_KEY"
    ```
- Key changes: `Authorization: Bearer` → `X-Api-Key`, URL path from `/v1/notifications` → `/api/notifications`, and the request body reflects the actual `EnqueueNotificationRequest` shape.

---

## Task 8: Clean up dead code

**Files:**
- `src/utils/types.ts` — Remove the `ApiKey` interface (lines 129–140). The generated `ApiKeyResponse` and `CreateApiKeyResponse` schemas replace it.
- `src/utils/api.ts` — Remove the `getApiKeys()` method (lines 126–128) and the `createApiKey()` method (lines 130–135). Also remove `ApiKey` from the import at line 7.
- Verify no other files import `ApiKey` from `../utils/types` — if they do, update those imports to use `ApiKeyResponse` from `@/api/generated/schemas`.

---

## Implementation Notes

- **No `pnpm orval` needed** — the hooks and schemas are already generated and present in `src/api/generated/`.
- **Auth context** — `selectedOrg` from `useAuth()` is still needed for the `organizationId` field in create/revoke requests. The list/get endpoints rely on the `X-Organization-Id` header auto-injected by `src/api/http.ts`.
- **UI components available** — `Checkbox` (`src/components/ui/checkbox.tsx`) and `AlertDialog` (`src/components/ui/alert-dialog.tsx`) already exist in the component library.
- **Query invalidation pattern** — Use `getListApiKeysEndpointQueryKey()` from the generated file for cache invalidation, consistent with how other pages (providers, audiences, recipients) handle it.
