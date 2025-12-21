import type {
  NotificationChannelType,
  NotificationPriority,
  NotificationStatus,
} from '@/api/generated/schemas';

export interface NotificationFilters {
  status: string;
  channel: string;
  search: string;
  unreadOnly: boolean;
}

export interface PaginationState {
  total: number;
  limit: number;
  offset: number;
  currentPage: number;
}

export interface NotificationListItem {
  id: string;
  title: string;
  body: string;
  status: NotificationStatus;
  channel: NotificationChannelType;
  template: string;
  recipient: string;
  created?: string;
  attempts: number;
  latency?: number;
  raw?: unknown;
}

export type NotificationDetailResponse = Record<string, unknown>;

export interface NotificationComposerState {
  recipientType: 'individual' | 'audience';
  templateType: 'existing' | 'inline';
  selectedChannel: NotificationChannelType;
  priority: NotificationPriority;
}
