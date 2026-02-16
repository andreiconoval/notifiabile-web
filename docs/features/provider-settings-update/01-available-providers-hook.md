# Task 01: Create `useAvailableProviders` Hook

## Why

Multiple components need the discovery data (create dialog, update dialog, provider info, provider card). Centralizing the query with proper caching avoids duplicate fetches and gives every consumer a typed, lookup-friendly API.

## File

`src/app/dashboard/providers/hooks/use-available-providers.ts` (new)

## Requirements

1. Call `useGetAvailableProvidersEndpoint()` with aggressive caching:
   ```ts
   staleTime: 60 * 60 * 1000, // 1 hour — matches backend Cache-Control
   gcTime: 60 * 60 * 1000,
   ```

2. Expose derived helpers (computed from the raw response):

   ```ts
   interface UseAvailableProvidersReturn {
     /** Raw API response */
     data: AvailableProvidersResponse | undefined;
     isLoading: boolean;

     /** Flat list of all channels */
     channels: ChannelDefinitionResponse[];

     /** Flat list of all providers across all channels */
     allProviders: ProviderDefinitionResponse[];

     /** Look up a provider definition by ProviderType */
     getProvider: (type: ProviderType) => ProviderDefinitionResponse | undefined;

     /** Look up which channel a provider belongs to */
     getChannelForProvider: (type: ProviderType) => ChannelDefinitionResponse | undefined;

     /** Get settings schema for a provider */
     getSettings: (type: ProviderType) => ProviderSettingDefinitionResponse[];
   }
   ```

3. Memoize derived values with `useMemo` to avoid recomputing on every render.

## Acceptance Criteria

- Hook compiles and exports from the hooks folder.
- Calling `getProvider('mailjet')` returns the Mailjet definition.
- Calling `getChannelForProvider('mailjet')` returns the Email channel.
- Calling `getSettings('mailjet')` returns the array of setting definitions.
- Data is fetched once and reused across components (React Query dedup).
