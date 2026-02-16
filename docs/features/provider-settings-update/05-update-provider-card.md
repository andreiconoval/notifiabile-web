# Task 05: Update Provider Card

## File

`src/app/dashboard/providers/components/provider-card.tsx`

## What to Change

### 1. Remove Hardcoded Display References

The card currently doesn't display `fromAddress`, `endpoint`, or `region` directly — but if any such references exist, remove them. All non-secret settings should be read from `provider.settings["key"]` if shown.

### 2. Provider Display Name

Use `provider.displayName` (already available in `ProviderResponse`) instead of the hardcoded `providerLabels` map. The discovery API can provide a fallback display name if the provider's custom name is empty.

### 3. Channel Badge

Use `useAvailableProviders().getChannelForProvider(provider.type)` to get the channel `displayName` for the badge (e.g., "Email", "Push", "SMS"), instead of the hardcoded `channelLabels` map.

### 4. Provider Icon (Keep Pragmatic)

The `providerIconMap` mapping icons to provider types is acceptable to keep as a local UI concern — the backend doesn't serve icons. If a provider type has no icon mapping, fall back to a generic icon based on channel type:
- Email channel -> `Mail`
- Push channel -> `Smartphone`
- SMS channel -> `MessageSquare`
- Default -> `Globe`

### 5. Non-Secret Settings Display (Optional)

Consider showing a summary of non-secret settings on the card. Use the discovery data to check `fieldType !== 'secret'`:

```tsx
const visibleSettings = providerSchema?.settings
  ?.filter(s => s.fieldType !== 'secret')
  ?.map(s => ({ label: s.displayName, value: provider.settings?.[s.key!] }))
  ?.filter(s => s.value);
```

Display these as small key-value pairs below the provider name if space allows.

## Acceptance Criteria

- No hardcoded `providerLabels` or `channelLabels` references.
- Provider name uses `provider.displayName` or discovery fallback.
- Channel badge uses discovery data.
- Icon mapping has a channel-based fallback for unknown provider types.
- Secret settings are never displayed on the card.
