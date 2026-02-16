import { useMemo } from 'react';
import { useGetAvailableProvidersEndpoint } from '@/api/generated/notifiable.web';
import type {
  ChannelDefinitionResponse,
  ProviderDefinitionResponse,
  ProviderSettingDefinitionResponse,
} from '@/api/generated/schemas';
import type { ProviderType } from '@/api/generated/schemas';

const ONE_HOUR = 60 * 60 * 1000;

export function useAvailableProviders() {
  const { data, isLoading } = useGetAvailableProvidersEndpoint({
    query: {
      staleTime: ONE_HOUR,
      gcTime: ONE_HOUR,
    },
  });

  const channels = useMemo<ChannelDefinitionResponse[]>(
    () => data?.channels ?? [],
    [data?.channels],
  );

  const allProviders = useMemo<ProviderDefinitionResponse[]>(
    () => channels.flatMap((ch) => ch.providers ?? []),
    [channels],
  );

  const providerMap = useMemo(() => {
    const map = new Map<ProviderType, ProviderDefinitionResponse>();
    for (const p of allProviders) {
      if (p.type) map.set(p.type, p);
    }
    return map;
  }, [allProviders]);

  const channelByProviderMap = useMemo(() => {
    const map = new Map<ProviderType, ChannelDefinitionResponse>();
    for (const ch of channels) {
      for (const p of ch.providers ?? []) {
        if (p.type) map.set(p.type, ch);
      }
    }
    return map;
  }, [channels]);

  const getProvider = useMemo(
    () => (type: ProviderType) => providerMap.get(type),
    [providerMap],
  );

  const getChannelForProvider = useMemo(
    () => (type: ProviderType) => channelByProviderMap.get(type),
    [channelByProviderMap],
  );

  const getSettings = useMemo(
    () => (type: ProviderType): ProviderSettingDefinitionResponse[] =>
      providerMap.get(type)?.settings ?? [],
    [providerMap],
  );

  return {
    data,
    isLoading,
    channels,
    allProviders,
    getProvider,
    getChannelForProvider,
    getSettings,
  };
}
