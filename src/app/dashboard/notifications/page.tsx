'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getNotificationsListEndpoint } from '@/api/generated/notifiable.web';
import type { NotificationListItemResponse } from '@/api/generated/schemas';
import { NotificationReadState } from '@/api/generated/schemas';
import NotificationCreateDialog from './components/NotificationCreateDialog';
import NotificationDetailsSheet from './components/NotificationDetailsSheet';
import NotificationsList from './components/NotificationsList';
import type {
  NotificationDetailResponse,
  NotificationFilters,
  NotificationListItem,
  PaginationState,
} from './types';

function mapNotification(dto: NotificationListItemResponse): NotificationListItem {
  const fallbackId =
    dto.id ??
    (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`);

  return {
    id: fallbackId,
    title: dto.title ?? 'Notification',
    body: dto.body ?? '',
    status: dto.status ?? 'queued',
    channel: dto.channel ?? 'email',
    template: dto.title ?? 'Message',
    recipient: dto.correlationId ?? 'Unknown',
    created: dto.createdAt ?? undefined,
    attempts: dto.status === 'sent' ? 1 : 0,
    latency: undefined,
    raw: dto,
  };
}

function applyFilters(items: NotificationListItem[], filters: NotificationFilters) {
  return items.filter((item) => {
    if (filters.status && item.status !== filters.status) {
      return false;
    }

    if (filters.channel && item.channel !== filters.channel) {
      return false;
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      const haystack = [item.title, item.body, item.recipient, item.id].join(' ').toLowerCase();
      if (!haystack.includes(search)) {
        return false;
      }
    }

    return true;
  });
}

export default function NotificationsPage() {
  const { selectedOrg, selectedEnv } = useAuth();
  const [notifications, setNotifications] = useState<NotificationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<NotificationListItem | null>(
    null,
  );
  const [notificationDetails, setNotificationDetails] = useState<NotificationDetailResponse | null>(
    null,
  );
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState<NotificationFilters>({
    status: '',
    channel: '',
    search: '',
    unreadOnly: false,
  });
  const [pagination, setPagination] = useState<PaginationState>({
    total: 0,
    limit: 20,
    offset: 0,
    currentPage: 1,
  });

  const loadNotifications = useCallback(async () => {
    if (!selectedOrg) {
      setNotifications([]);
      setPagination((prev) => ({ ...prev, total: 0, offset: 0, currentPage: 1 }));
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const readState = filters.unreadOnly ? NotificationReadState.Unread : NotificationReadState.All;
      const response = await getNotificationsListEndpoint({
        readState,
        page: pagination.currentPage,
        pageSize: pagination.limit,
        title: filters.search || null,
        body: null,
        statuses: filters.status ? [filters.status as never] : null,
        channels: filters.channel ? [filters.channel as never] : null,
      });

      const mapped = (response.items ?? []).map(mapNotification);
      const total = response.total ?? mapped.length;

      setNotifications(mapped);
      setPagination((prev) => ({
        ...prev,
        total,
        offset: ((response.page ?? 1) - 1) * (response.pageSize ?? pagination.limit),
        currentPage: response.page ?? pagination.currentPage,
      }));
    } catch (error) {
      console.error('Failed to load notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [selectedOrg?.id, pagination.currentPage, pagination.limit, filters]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  function handleFiltersChange(updatedFilters: NotificationFilters) {
    setFilters(updatedFilters);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }

  function handlePageChange(page: number) {
    if (page <= 0) return;
    setPagination((prev) => ({ ...prev, currentPage: page }));
  }

  async function viewNotification(notification: NotificationListItem) {
    setSelectedNotification(notification);
    setDetailsLoading(true);
    try {
      // const details = (await getNotificationStatusEndpoint(notification.id)) as NotificationDetailResponse;
      // setNotificationDetails(details ?? null);
    } catch (error) {
      console.error('Failed to load notification details:', error);
      toast.error('Failed to load notification details');
      setNotificationDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 mb-2">Notifications</h1>
          <p className="text-gray-600">Send and manage notification delivery</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => void loadNotifications()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Send Notification
          </Button>
        </div>
      </div>

      <NotificationsList
        notifications={notifications}
        loading={loading}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        pagination={pagination}
        onPageChange={handlePageChange}
        onViewDetails={viewNotification}
      />

      <NotificationCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        orgId={selectedOrg?.id}
        env={selectedEnv}
        onSent={() => void loadNotifications()}
      />

      <NotificationDetailsSheet
        notification={selectedNotification}
        detailData={notificationDetails}
        loading={detailsLoading}
        onClose={() => {
          setSelectedNotification(null);
          setNotificationDetails(null);
        }}
      />
    </div>
  );
}
