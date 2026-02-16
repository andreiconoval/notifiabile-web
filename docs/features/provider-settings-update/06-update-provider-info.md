# Task 06: Update Provider Info Component

## File

`src/app/dashboard/providers/components/provider-info.tsx`

## What to Change

Replace the hardcoded informational text with data from the discovery API.

### Current State

Static card listing:
- "Email Providers" with hardcoded mentions of Mailjet, SendGrid, Amazon SES
- "Push Notification Providers" with hardcoded mentions of FCM, APNs
- "SMS Providers" with hardcoded mentions of Twilio, Vonage
- "Web Push Providers" with hardcoded mentions of OneSignal, Pusher

### New Implementation

Use `useAvailableProviders()` to dynamically render:

```tsx
const { channels, isLoading } = useAvailableProviders();

// For each channel, list its providers with their descriptions
{channels.map(channel => (
  <div key={channel.channelType}>
    <h3>{channel.displayName}</h3>
    <ul>
      {channel.providers?.map(provider => (
        <li key={provider.type}>
          <strong>{provider.displayName}</strong>
          {provider.description && <span> — {provider.description}</span>}
          <div>Required: {provider.settings?.filter(s => s.isRequired).map(s => s.displayName).join(', ')}</div>
        </li>
      ))}
    </ul>
  </div>
))}
```

### Keep It Informational

This component is for reference — it helps users understand what providers are available and what credentials they'll need before clicking "Add Provider". Show:
- Channel name as section header
- Provider name + description
- List of required settings (display names, not keys)

## Acceptance Criteria

- No hardcoded provider or channel descriptions.
- All available providers are listed dynamically.
- Required settings are shown per provider.
- Loading state while discovery data is fetched.
- Component handles empty/error states gracefully.
