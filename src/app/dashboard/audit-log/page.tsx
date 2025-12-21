'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileSearch } from 'lucide-react';
import type { AuditLog } from '../../../utils/types';
import { toast } from 'sonner';

export default function AuditLogPage() {
  const { selectedOrg, user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [selectedOrg]);

  async function loadLogs() {
    if (!selectedOrg) return;

    // Check if user has permission
    if (!['OrgOwner', 'PlatformAdmin', 'SupportAgent'].includes(user?.role || '')) {
      toast.error('You do not have permission to view audit logs');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result = await api.getAuditLog(selectedOrg.id);
      setLogs(result.logs);
    } catch (error) {
      console.error('Failed to load audit log:', error);
      toast.error('Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }

  if (!['OrgOwner', 'PlatformAdmin', 'SupportAgent'].includes(user?.role || '')) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileSearch className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg mb-2">Access Restricted</h3>
            <p className="text-sm text-gray-600 text-center">
              You don't have permission to view audit logs. Contact your organization owner.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 mb-2">Audit Log</h1>
        <p className="text-gray-600">
          Immutable record of all actions performed in your organization
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>Last 100 events (most recent first)</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileSearch className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg mb-2">No activity yet</h3>
              <p className="text-sm text-gray-600">
                Audit events will appear here once actions are performed
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">{log.userId.substring(0, 8)}...</TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell className="capitalize">{log.resource}</TableCell>
                    <TableCell className="font-mono text-xs text-gray-600">
                      {JSON.stringify(log.details).substring(0, 50)}...
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Log Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• All actions are logged immutably and cannot be deleted or modified</p>
            <p>• Logs are retained for 90 days for compliance purposes</p>
            <p>• Sensitive data is masked in audit logs for privacy</p>
            <p>• Export functionality available for compliance reporting</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
