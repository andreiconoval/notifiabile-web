'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Code } from 'lucide-react';
import { toast } from 'sonner';

import { useGetTemplateListEndpoint } from '@/api/generated/notifiable.web';
import { TemplateResponse, NotificationChannelType } from '@/api/generated/schemas';

import TemplateCard from './template-card';
import CreateTemplateDialog from './create-template-dialog';

export default function TemplatesPage() {
  const { selectedOrg, selectedEnv } = useAuth();
  const { data, isLoading, refetch, isError, error } = useGetTemplateListEndpoint();

  useEffect(() => {
    refetch();
  }, [selectedOrg, selectedEnv]);

  useEffect(() => {
    if (isError) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates');
    }
  }, [error, isError]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 mb-2">Templates</h1>
          <p className="text-gray-600">Manage notification templates across channels</p>
        </div>
        <CreateTemplateDialog onTemplateCreated={refetch} />
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="push">Push</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : data?.items?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Code className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg mb-2">No templates yet</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Create your first template to get started
                </p>
                <CreateTemplateDialog onTemplateCreated={refetch}>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                </CreateTemplateDialog>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data?.items?.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          )}
        </TabsContent>

        {(['email', 'push', 'sms'] as NotificationChannelType[]).map((channel) => (
          <TabsContent key={channel} value={channel} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data?.items
                ?.filter((t) => t.channelType === channel)
                .map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
