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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, BarChart3, Play, Pause, Calendar } from 'lucide-react';
import type { Campaign, CampaignStatus } from '../../../utils/types';
import { toast } from 'sonner';

export default function CampaignsPage() {
  const { selectedOrg, selectedEnv } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, [selectedOrg, selectedEnv]);

  async function loadCampaigns() {
    if (!selectedOrg) return;

    setLoading(true);
    try {
      const result = await api.getCampaigns(selectedOrg.id, selectedEnv);
      setCampaigns(result.campaigns);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }

  async function createCampaign(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedOrg) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const templateId = formData.get('templateId') as string;
    const audienceId = formData.get('audienceId') as string;

    try {
      await api.createCampaign({
        orgId: selectedOrg.id,
        env: selectedEnv,
        name,
        templateId,
        audienceId,
      });
      toast.success('Campaign created successfully');
      setCreateDialogOpen(false);
      loadCampaigns();
    } catch (error) {
      console.error('Failed to create campaign:', error);
      toast.error('Failed to create campaign');
    }
  }

  const statusColors: Record<CampaignStatus, string> = {
    draft: 'bg-gray-500',
    scheduled: 'bg-blue-500',
    active: 'bg-green-500',
    paused: 'bg-yellow-500',
    completed: 'bg-purple-500',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 mb-2">Campaigns</h1>
          <p className="text-gray-600">Create and manage notification campaigns</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Campaign</DialogTitle>
              <DialogDescription>Set up a new notification campaign</DialogDescription>
            </DialogHeader>
            <form onSubmit={createCampaign}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input id="name" name="name" placeholder="Summer Promotion 2024" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="templateId">Template</Label>
                  <Input id="templateId" name="templateId" placeholder="template-id" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="audienceId">Audience</Label>
                  <Input id="audienceId" name="audienceId" placeholder="audience-id" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg mb-2">No campaigns yet</h3>
            <p className="text-sm text-gray-600 mb-4">Create your first campaign to get started</p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <CardDescription className="mt-1">
                      Created {new Date(campaign.created).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <div className={`h-2 w-2 rounded-full ${statusColors[campaign.status]}`} />
                    {campaign.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Sent</p>
                      <p className="text-lg">{campaign.analytics?.sent || 0}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Delivered</p>
                      <p className="text-lg">{campaign.analytics?.delivered || 0}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Failed</p>
                      <p className="text-lg">{campaign.analytics?.failed || 0}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Analytics
                    </Button>
                    {campaign.status === 'draft' && (
                      <Button size="sm" variant="outline">
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    {campaign.status === 'active' && (
                      <Button size="sm" variant="outline">
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
