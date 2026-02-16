import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAvailableProviders } from '../hooks/use-available-providers';

export function ProviderInfo() {
  const { channels, isLoading } = useAvailableProviders();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Provider Configuration</CardTitle>
        <CardDescription>Configure delivery providers for each channel</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-64" />
              </div>
            ))}
          </div>
        ) : channels.length === 0 ? (
          <p className="text-sm text-muted-foreground">No provider information available.</p>
        ) : (
          <div className="space-y-5">
            {channels.map((channel) => (
              <div key={channel.channelType}>
                <h4 className="text-sm font-medium mb-2">{channel.displayName}</h4>
                <ul className="space-y-2">
                  {(channel.providers ?? []).map((provider) => (
                    <li key={provider.type} className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{provider.displayName}</span>
                      {provider.description && <span> — {provider.description}</span>}
                      {provider.settings && provider.settings.some((s) => s.isRequired) && (
                        <div className="text-xs mt-0.5">
                          Requires:{' '}
                          {provider.settings
                            .filter((s) => s.isRequired)
                            .map((s) => s.displayName)
                            .join(', ')}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
