'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Filter, Search, ChevronLeft, ChevronRight, Eye, SearchIcon } from 'lucide-react';
import { STATUS_COLORS } from '../constants';
import type { NotificationFilters, NotificationListItem, PaginationState } from '../types';

interface NotificationsListProps {
  notifications: NotificationListItem[];
  loading: boolean;
  filters: NotificationFilters;
  onFiltersChange: (filters: NotificationFilters) => void;
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  onViewDetails: (notification: NotificationListItem) => void;
}

const statusOptions = [
  { value: 'delivered', label: 'Delivered' },
  { value: 'failed', label: 'Failed' },
  { value: 'pending', label: 'Pending' },
  { value: 'cancelled', label: 'Cancelled' },
];

const channelOptions = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'push', label: 'Push' },
  { value: 'internal', label: 'In-App' },
];

export default function NotificationsList({
  notifications,
  loading,
  filters,
  onFiltersChange,
  pagination,
  onPageChange,
  onViewDetails,
}: NotificationsListProps) {
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));
  const canGoPrevious = pagination.currentPage > 1;
  const canGoNext = pagination.currentPage < totalPages;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50">
                <SearchIcon className="size-4" />
                <span className="sr-only">Search</span>
              </div>
              <Input
                placeholder="Search by title, body, recipient, or ID..."
                value={filters.search}
                onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
                className="peer px-9 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none"
              />
            </div>
            <Select
              value={filters.status || undefined}
              onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.channel || undefined}
              onValueChange={(value) => onFiltersChange({ ...filters, channel: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All channels" />
              </SelectTrigger>
              <SelectContent>
                {channelOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                onClick={() =>
                  onFiltersChange({ status: '', channel: '', search: '', unreadOnly: false })
                }
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="unread-only"
                  checked={filters.unreadOnly}
                  onCheckedChange={(checked) =>
                    onFiltersChange({ ...filters, unreadOnly: Boolean(checked) })
                  }
                />
                <Label htmlFor="unread-only" className="text-sm text-gray-600">
                  Unread only
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Latency</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          No notifications found
                        </TableCell>
                      </TableRow>
                    ) : (
                      notifications.map((notification) => (
                        <TableRow key={notification.id}>
                          <TableCell>
                            <Badge variant="secondary" className="gap-1 capitalize">
                              <div
                                className={`h-2 w-2 rounded-full ${STATUS_COLORS[notification.status]}`}
                              />
                              {notification.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize">{notification.channel}</TableCell>
                          <TableCell className="font-mono text-sm truncate max-w-[220px]">
                            {notification.template}
                          </TableCell>
                          <TableCell className="truncate max-w-[220px]">
                            {notification.recipient}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {notification.created
                              ? new Date(notification.created).toLocaleString()
                              : '—'}
                          </TableCell>
                          <TableCell>{notification.attempts}</TableCell>
                          <TableCell>
                            {typeof notification.latency === 'number'
                              ? `${notification.latency}ms`
                              : '—'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewDetails(notification)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="text-sm text-gray-500">
                  Showing {pagination.total === 0 ? 0 : pagination.offset + 1} to{' '}
                  {Math.min(pagination.offset + notifications.length, pagination.total)} of{' '}
                  {pagination.total} notifications
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(pagination.currentPage - 1)}
                    disabled={!canGoPrevious}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = index + 1;
                      } else if (pagination.currentPage <= 3) {
                        pageNum = index + 1;
                      } else if (pagination.currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + index;
                      } else {
                        pageNum = pagination.currentPage - 2 + index;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={pagination.currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => onPageChange(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(pagination.currentPage + 1)}
                    disabled={!canGoNext}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
