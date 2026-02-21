import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FlaskConical,
  Globe,
  LucideIcon,
  Mail,
  MessageSquare,
  Settings,
  Smartphone,
  Star,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getListProvidersEndpointQueryKey,
  useMakeDefaultProviderEndpoint,
} from '@/api/generated/notifiable.web';
import { NotificationChannelType, ProviderStatus } from '@/api/generated/schemas';
import type { Provider } from '../types';
import { useAuth } from '@/contexts/AuthContext';
import { useAvailableProviders } from '../hooks/use-available-providers';
import { UpdateProviderDialog } from './update-provider-dialog';
import { ValidateProviderDialog } from './validate-provider-dialog';

// Icon per provider type — falls back to channel-based icon
const providerIconMap: Record<string, LucideIcon> = {
  mailjet: Mail,
  sendGrid: Mail,
  fcm: Smartphone,
  apNs: Smartphone,
  oneSignal: Globe,
  twilio: MessageSquare,
};

const channelIconMap: Record<string, LucideIcon> = {
  [NotificationChannelType.Email]: Mail,
  [NotificationChannelType.Push]: Smartphone,
  [NotificationChannelType.Sms]: MessageSquare,
};

const statusColorMap: Record<ProviderStatus, string> = {
  active: 'bg-green-500',
  error: 'bg-red-500',
  degraded: 'bg-yellow-500',
  inactive: 'bg-gray-400',
};

export function ProviderCard({ provider }: { provider: Provider }) {
  const { selectedOrg } = useAuth();
  const { getProvider, getChannelForProvider } = useAvailableProviders();
  const queryClient = useQueryClient();
  const { mutateAsync: makeDefault } = useMakeDefaultProviderEndpoint();

  const providerDef = provider.type ? getProvider(provider.type) : undefined;
  const channelDef = provider.type ? getChannelForProvider(provider.type) : undefined;

  // Resolve icon: provider-specific → channel-based → Globe fallback
  const Icon =
    providerIconMap[provider.type ?? ''] ??
    channelIconMap[channelDef?.channelType ?? ''] ??
    Globe;

  const statusColor = statusColorMap[provider.status ?? 'inactive'];

  const handleMakeDefault = async () => {
    if (!provider.id) return;
    try {
      await makeDefault({ id: provider.id, data: { organizationId: selectedOrg?.id } });
      await queryClient.invalidateQueries({ queryKey: getListProvidersEndpointQueryKey() });
    } catch (err) {
      console.error('Failed to set default provider:', err);
      toast.error('Failed to set default provider');
    }
  };

  return (
    <Card
      className={`hover:shadow-md transition-shadow ${
        provider.isDefault ? 'border-2 border-indigo-500 shadow-md' : ''
      }`}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Icon className="h-5 w-5 text-indigo-700" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {provider.displayName ?? providerDef?.displayName}
              </CardTitle>
              <CardDescription>
                {channelDef?.displayName ?? provider.channelType}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleMakeDefault}
              className={`p-1 rounded-full ${
                provider.isDefault ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500'
              }`}
              title={provider.isDefault ? 'Default provider' : 'Make default'}
            >
              <Star className="h-4 w-4" fill={provider.isDefault ? '#f59e0b' : 'none'} />
            </button>
            <div className={`h-2 w-2 rounded-full ${statusColor}`} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status</span>
            <Badge
              variant={
                provider.status === 'active'
                  ? 'default'
                  : provider.status === 'error'
                    ? 'destructive'
                    : 'outline'
              }
            >
              {provider.status}
            </Badge>
          </div>
          {provider.health && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Uptime</span>
                <span className="text-sm">{provider.health.uptime}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Error Rate</span>
                <span className="text-sm">{provider.health.errorRate}%</span>
              </div>
            </>
          )}
          <div className="flex gap-2 mt-4">
            <UpdateProviderDialog
              provider={provider}
              trigger={
                <Button size="sm" variant="outline" className="flex-1">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              }
            />
            <ValidateProviderDialog
              provider={provider}
              trigger={
                <Button size="sm" variant="outline" className="flex-1">
                  <FlaskConical className="h-4 w-4 mr-2" />
                  Test
                </Button>
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
