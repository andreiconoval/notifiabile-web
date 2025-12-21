import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus, Settings } from 'lucide-react';
import { ProviderCard } from './provider-card';
import type { Provider } from '../types';

type ProvidersGridProps = {
  providers: Provider[];
  loading: boolean;
  onAddProvider: () => void;
};

export function ProvidersGrid({ providers, loading, onAddProvider }: ProvidersGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Settings className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg mb-2">No providers configured</h3>
          <p className="text-sm text-gray-600 mb-4 text-center max-w-md">
            Configure delivery providers to start sending notifications
          </p>
          <Button onClick={onAddProvider}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Provider
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {providers.map((provider) => (
        <ProviderCard key={provider.id} provider={provider} />
      ))}
    </div>
  );
}
