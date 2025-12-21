'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Key, Copy, Eye, EyeOff } from 'lucide-react';
import type { ApiKey, Environment } from '../../../utils/types';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function APIKeysPage() {
  const { selectedOrg, selectedEnv } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newKey, setNewKey] = useState<ApiKey | null>(null);

  useEffect(() => {
    loadKeys();
  }, [selectedOrg]);

  async function loadKeys() {
    if (!selectedOrg) return;

    setLoading(true);
    try {
      const result = await api.getApiKeys(selectedOrg.id);
      setKeys(result.keys);
    } catch (error) {
      console.error('Failed to load API keys:', error);
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }

  async function createKey(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedOrg) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const env = formData.get('env') as Environment;

    try {
      const key = await api.createApiKey({
        orgId: selectedOrg.id,
        name,
        env,
      });
      setNewKey(key);
      toast.success('API key created successfully');
      loadKeys();
    } catch (error) {
      console.error('Failed to create API key:', error);
      toast.error('Failed to create API key');
    }
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    toast.success('API key copied to clipboard');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 mb-2">API Keys & Access</h1>
          <p className="text-gray-600">Manage API keys for programmatic access</p>
        </div>
        <Dialog
          open={createDialogOpen}
          onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) setNewKey(null);
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{newKey ? 'API Key Created' : 'Create API Key'}</DialogTitle>
              <DialogDescription>
                {newKey
                  ? "Copy your API key now. It won't be shown again."
                  : 'Generate a new API key for accessing the Notifiable API'}
              </DialogDescription>
            </DialogHeader>
            {newKey ? (
              <div className="space-y-4 py-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-2">API Key</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono bg-white px-3 py-2 rounded border">
                      {newKey.key}
                    </code>
                    <Button size="sm" variant="outline" onClick={() => copyKey(newKey.key)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-900">
                    ⚠️ Make sure to copy your API key now. You won't be able to see it again!
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={createKey}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Key Name</Label>
                    <Input id="name" name="name" placeholder="Production API Key" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="env">Environment</Label>
                    <Select name="env" defaultValue={selectedEnv}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="production">Production</SelectItem>
                        <SelectItem value="staging">Staging</SelectItem>
                        <SelectItem value="dev">Development</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create Key</Button>
                </DialogFooter>
              </form>
            )}
            {newKey && (
              <DialogFooter>
                <Button
                  onClick={() => {
                    setCreateDialogOpen(false);
                    setNewKey(null);
                  }}
                >
                  Done
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            These keys allow programmatic access to the Notifiable API
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : keys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Key className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg mb-2">No API keys yet</h3>
              <p className="text-sm text-gray-600 mb-4">Create your first API key to get started</p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create API Key
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Environment</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell>{key.name}</TableCell>
                    <TableCell>
                      <code className="text-xs font-mono">{key.key}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {key.env}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(key.created).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => copyKey(key.key)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          Revoke
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Using the API</CardTitle>
          <CardDescription>Quick start guide for integrating with Notifiable</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm mb-2">Send a notification</h4>
              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                <pre>{`curl -X POST https://api.notifiable.io/v1/notifications \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "template": "welcome-email",
    "recipient": "user@example.com",
    "variables": {
      "name": "John Doe"
    }
  }'`}</pre>
              </div>
            </div>
            <div>
              <h4 className="text-sm mb-2">Check notification status</h4>
              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                <pre>{`curl https://api.notifiable.io/v1/notifications/:id \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</pre>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
