import type { NotificationStatus } from '@/api/generated/schemas';

export const STATUS_COLORS: Record<NotificationStatus, string> = {
  sent: 'bg-green-500',
  failed: 'bg-red-500',
  processing: 'bg-yellow-500',
  queued: 'bg-yellow-800',
  partiallyDelivered: 'bg-orange-500',
};

export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
] as const;
