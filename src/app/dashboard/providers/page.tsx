'use client';
import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../../contexts/AuthContext';
import { CreateProviderDialog } from './components/create-provider-dialog';
import { ProvidersGrid } from './components/providers-grid';
import { ProviderInfo } from './components/provider-info';
import {
  getListProvidersEndpointQueryKey,
  useListProvidersEndpoint,
} from '@/api/generated/notifiable.web';
import type { ProviderResponse } from '@/api/generated/schemas';
import { useQueryClient } from '@tanstack/react-query';

export default function ProvidersPage() {
  const { selectedOrg } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useListProvidersEndpoint();

  useEffect(() => {
    refetch();
  }, [selectedOrg, refetch]);

  useEffect(() => {
    if (isError) {
      console.error('Failed to load providers:', error);
      toast.error('Failed to load providers');
    }
  }, [error, isError]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 mb-2">Channels & Providers</h1>
          <p className="text-gray-600">Configure notification delivery providers</p>
        </div>
        <CreateProviderDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          orgId={selectedOrg?.id}
          onProviderCreated={() =>
            queryClient.invalidateQueries({ queryKey: getListProvidersEndpointQueryKey() })
          }
          trigger={
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Provider
            </Button>
          }
        />
      </div>

      <ProvidersGrid
        providers={(data as ProviderResponse[]) ?? []}
        loading={isLoading}
        onAddProvider={() => setCreateDialogOpen(true)}
      />

      <ProviderInfo />
    </div>
  );
}
