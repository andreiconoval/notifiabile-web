'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../../contexts/AuthContext';
import AudienceCard from './audience-card';
import AudienceFormDialog from './audience-form-dialog';
import AudiencesHeader from './audiences-header';
import DeleteAudienceDialog from './delete-audience-dialog';
import ManageRecipientsDialog from './manage-recipients-dialog';
import { Audience, AudienceContact, AudienceFormValues } from './types';
import {
  getListAudiencesEndpointQueryKey,
  useAddAudienceMemberEndpoint,
  useCreateAudienceEndpoint,
  useDeleteAudienceEndpoint,
  useGetAudienceContactsEndpoint,
  useGetAudienceEndpoint,
  useListAudiencesEndpoint,
  useListContactsEndpoint,
  useRemoveAudienceMemberEndpoint,
  useUpdateAudienceEndpoint,
} from '@/api/generated/notifiable.web';
import type {
  AudienceCreateRequest,
  AudienceGroupDto,
  ContactRecord,
  UpdateAudienceRequest,
} from '@/api/generated/schemas';

function mapAudience(dto: AudienceGroupDto, organizationId: string): Audience {
  return {
    id: dto.id ?? '',
    organizationId: dto.organizationId ?? organizationId,
    name: dto.name ?? 'Untitled audience',
    description: dto.description ?? undefined,
    type: (dto.type as Audience['type']) ?? 'static',
    filterExpressions: dto.filterExpressions ?? undefined,
  };
}

export default function AudiencesPage() {
  const { selectedOrg } = useAuth();
  const queryClient = useQueryClient();

  const listParams = useMemo(
    () => ({
      organizationId: selectedOrg?.id ?? '',
      search: null,
      page: 1,
      pageSize: 50,
    }),
    [selectedOrg],
  );

  const listQueryKey = useMemo(() => getListAudiencesEndpointQueryKey(listParams), [listParams]);

  const audiencesQuery = useListAudiencesEndpoint(listParams, {
    query: {
      enabled: Boolean(selectedOrg?.id),
    },
  });

  const contactsQuery = useListContactsEndpoint(
    {
      search: null,
      skip: 0,
      take: 200,
    },
    { query: { enabled: Boolean(selectedOrg?.id) } },
  );

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [manageRecipientsDialogOpen, setManageRecipientsDialogOpen] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState<Audience | null>(null);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [audienceContactTotals, setAudienceContactTotals] = useState<Record<string, number>>({});

  const audienceDetailsQuery = useGetAudienceEndpoint(selectedAudience?.id ?? '', {
    query: {
      enabled: Boolean(selectedOrg?.id && selectedAudience?.id && editDialogOpen),
    },
  });

  const audienceContactsQuery = useGetAudienceContactsEndpoint(
    selectedAudience?.id ?? '',
    { page: 1, pageSize: 200, search: null },
    {
      query: {
        enabled: Boolean(selectedOrg?.id && selectedAudience?.id && manageRecipientsDialogOpen),
      },
    },
  );

  const createAudienceMutation = useCreateAudienceEndpoint(
    {
      mutation: {
        onSuccess: () => {
          toast.success('Audience created successfully');
          setCreateDialogOpen(false);
          queryClient.invalidateQueries({ queryKey: listQueryKey });
        },
        onError: (err) => {
          console.error('Failed to create audience:', err);
          toast.error('Failed to create audience');
        },
      },
    },
    queryClient,
  );

  const updateAudienceMutation = useUpdateAudienceEndpoint(
    {
      mutation: {
        onSuccess: () => {
          toast.success('Audience updated successfully');
          setEditDialogOpen(false);
          setSelectedAudience(null);
          queryClient.invalidateQueries({ queryKey: listQueryKey });
        },
        onError: (err) => {
          console.error('Failed to update audience:', err);
          toast.error('Failed to update audience');
        },
      },
    },
    queryClient,
  );

  const deleteAudienceMutation = useDeleteAudienceEndpoint(
    {
      mutation: {
        onSuccess: () => {
          toast.success('Audience deleted successfully');
          setDeleteDialogOpen(false);
          setSelectedAudience(null);
          queryClient.invalidateQueries({ queryKey: listQueryKey });
        },
        onError: (err) => {
          console.error('Failed to delete audience:', err);
          toast.error('Failed to delete audience');
        },
      },
    },
    queryClient,
  );

  const addAudienceMemberMutation = useAddAudienceMemberEndpoint(
    {
      mutation: {
        onError: (err) => {
          console.error('Failed to add audience member:', err);
          toast.error('Failed to add audience member');
        },
      },
    },
    queryClient,
  );

  const removeAudienceMemberMutation = useRemoveAudienceMemberEndpoint(
    {
      mutation: {
        onError: (err) => {
          console.error('Failed to remove audience member:', err);
          toast.error('Failed to remove audience member');
        },
      },
    },
    queryClient,
  );

  useEffect(() => {
    if (audiencesQuery.isError) {
      console.error('Failed to load audiences:', audiencesQuery.error);
      toast.error('Failed to load audiences');
    }
  }, [audiencesQuery.isError, audiencesQuery.error]);

  useEffect(() => {
    if (audienceContactsQuery.data?.items && selectedAudience?.id) {
      const ids = audienceContactsQuery.data.items
        ?.map((c) => c.id)
        .filter((id): id is string => Boolean(id));
      if (ids) {
        setSelectedRecipientIds(ids);
        setAudienceContactTotals((prev) => ({
          ...prev,
          [selectedAudience.id]: audienceContactsQuery.data?.total ?? ids.length,
        }));
      }
    }
  }, [audienceContactsQuery.data, selectedAudience?.id]);

  const audiences =
    audiencesQuery.data?.items?.map((item) =>
      mapAudience(item as AudienceGroupDto, listParams.organizationId),
    ) ?? [];
  const contacts = (contactsQuery.data?.items as AudienceContact[] | undefined) ?? [];
  const totalContacts = contacts.length;

  async function createAudience(values: AudienceFormValues) {
    if (!selectedOrg) return;
    const payload: AudienceCreateRequest = {
      name: values.name,
      description: values.description,
      type: values.type,
      filterExpressions: values.filterExpressions ?? undefined,
    };
    try {
      await createAudienceMutation.mutateAsync({ data: payload });
    } catch {
      // handled by mutation onError
    }
  }

  async function updateAudience(values: AudienceFormValues) {
    if (!selectedOrg || !selectedAudience) return;
    const payload: UpdateAudienceRequest = {
      name: values.name,
      description: values.description,
      type: values.type,
      filterExpressions: values.filterExpressions ?? undefined,
    };
    try {
      await updateAudienceMutation.mutateAsync({ id: selectedAudience.id, data: payload });
    } catch {
      // handled by mutation onError
    }
  }

  async function deleteAudience() {
    if (!selectedOrg || !selectedAudience) return;
    try {
      await deleteAudienceMutation.mutateAsync({
        data: { id: selectedAudience.id },
      });
    } catch {
      // handled by mutation onError
    }
  }

  async function updateAudienceRecipients() {
    if (!selectedOrg || !selectedAudience) return;

    const currentMembers =
      (audienceContactsQuery.data?.items ?? [])
        .map((c) => c.id)
        .filter((id): id is string => Boolean(id)) ?? [];

    const toAdd = selectedRecipientIds.filter((id) => !currentMembers.includes(id));
    const toRemove = currentMembers.filter((id) => !selectedRecipientIds.includes(id));

    try {
      await Promise.all([
        ...toAdd.map((contactId) =>
          addAudienceMemberMutation.mutateAsync({
            id: selectedAudience.id,
            data: { contactId, kind: 'include' },
          }),
        ),
        ...toRemove.map((contactId) =>
          removeAudienceMemberMutation.mutateAsync({
            data: { id: selectedAudience.id, contactId },
          }),
        ),
      ]);

      toast.success('Audience recipients updated successfully');
      setAudienceContactTotals((prev) => ({
        ...prev,
        [selectedAudience.id]: selectedRecipientIds.length,
      }));
      setManageRecipientsDialogOpen(false);
      setSelectedAudience(null);
      setSelectedRecipientIds([]);
      if (audienceContactsQuery.queryKey) {
        queryClient.invalidateQueries({ queryKey: audienceContactsQuery.queryKey });
      }
    } catch {
      // handled by mutation onError
    }
  }

  function openEditDialog(audience: Audience) {
    setSelectedAudience(audience);
    setEditDialogOpen(true);
  }

  function openDeleteDialog(audience: Audience) {
    setSelectedAudience(audience);
    setDeleteDialogOpen(true);
  }

  function openManageRecipientsDialog(audience: Audience) {
    setSelectedAudience(audience);
    setSelectedRecipientIds([]);
    setManageRecipientsDialogOpen(true);
  }

  function getRecipientsCount(audience: Audience): number {
    return audienceContactTotals[audience.id] ?? 0;
  }

  function handleImportCSV() {
    toast.info('CSV import coming soon!');
  }

  const audienceForEdit = audienceDetailsQuery.data
    ? mapAudience(audienceDetailsQuery.data as AudienceGroupDto, listParams.organizationId)
    : selectedAudience;

  const loadingAudiences = audiencesQuery.isLoading || audiencesQuery.isFetching;

  return (
    <div className="space-y-6">
      <AudiencesHeader onImport={handleImportCSV} onCreate={() => setCreateDialogOpen(true)} />

      {loadingAudiences ? (
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
      ) : audiences.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg mb-2">No audiences yet</h3>
            <p className="text-sm text-gray-600 mb-4 text-center max-w-md">
              Create audience segments to target specific groups of recipients with your campaigns
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>Create First Audience</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {audiences.map((audience) => (
            <AudienceCard
              key={audience.id}
              audience={audience}
              recipientsCount={getRecipientsCount(audience)}
              onManageRecipients={openManageRecipientsDialog}
              onEdit={openEditDialog}
              onDelete={openDeleteDialog}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Static Lists</CardTitle>
            <CardDescription>Fixed recipient lists</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Manually select recipients or upload CSV files to create static audience lists
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Dynamic Segments</CardTitle>
            <CardDescription>Rule-based audiences</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Build segments using attribute filters that automatically update as recipients change
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Contacts</CardTitle>
            <CardDescription>Across all audiences</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl">{totalContacts.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <AudienceFormDialog
        mode="create"
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            setSelectedAudience(null);
          }
        }}
        onSubmit={createAudience}
      />

      <AudienceFormDialog
        mode="edit"
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setSelectedAudience(null);
          }
        }}
        audience={audienceForEdit}
        onSubmit={updateAudience}
      />

      <ManageRecipientsDialog
        open={manageRecipientsDialogOpen}
        audience={selectedAudience}
        recipients={contacts as ContactRecord[]}
        selectedRecipientIds={selectedRecipientIds}
        onSelectionChange={setSelectedRecipientIds}
        onClose={() => {
          setManageRecipientsDialogOpen(false);
          setSelectedAudience(null);
          setSelectedRecipientIds([]);
        }}
        onConfirm={updateAudienceRecipients}
      />

      <DeleteAudienceDialog
        open={deleteDialogOpen}
        audience={selectedAudience}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setSelectedAudience(null);
        }}
        onConfirm={deleteAudience}
      />
    </div>
  );
}
