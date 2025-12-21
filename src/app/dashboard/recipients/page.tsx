'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '../../../contexts/AuthContext';
import DeleteRecipientDialog from './delete-recipient-dialog';
import RecipientFormDialog from './recipient-form-dialog';
import RecipientsHeader from './recipients-header';
import RecipientsSearchCard from './recipients-search-card';
import RecipientsTable from './recipients-table';
import { Contact, ContactFormValues } from './types';
import {
  getListContactsEndpointQueryKey,
  useDeleteContactEndpoint,
  useGetContactEndpoint,
  useListContactsEndpoint,
  useRegisterContactEndpoint,
  useUpdateContactEndpoint,
} from '@/api/generated/notifiable.web';
import type {
  ContactRecord,
  ContactUpsertRequest,
  ListContactsEndpointParams,
  UpdateContactRequest,
} from '@/api/generated/schemas';

export default function RecipientsPage() {
  const { selectedOrg } = useAuth();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<Contact | null>(null);

  const listParams: ListContactsEndpointParams = useMemo(
    () => ({
      organizationId: selectedOrg?.id ?? '',
      search: searchQuery || null,
      skip: 0,
      take: 200,
    }),
    [searchQuery, selectedOrg?.id],
  );

  const listQueryKey = useMemo(() => getListContactsEndpointQueryKey(listParams), [listParams]);

  const contactsQuery = useListContactsEndpoint(listParams, {
    query: {
      enabled: Boolean(selectedOrg?.id),
    },
  });

  const contactDetailsQuery = useGetContactEndpoint(selectedRecipient?.id ?? '', {
    query: {
      enabled: Boolean(editDialogOpen && selectedRecipient?.id && selectedOrg?.id),
    },
  });

  const createContactMutation = useRegisterContactEndpoint(
    {
      mutation: {
        onSuccess: () => {
          toast.success('Contact created successfully');
          setCreateDialogOpen(false);
          queryClient.invalidateQueries({ queryKey: listQueryKey });
        },
        onError: (err) => {
          console.error('Failed to create contact:', err);
          toast.error('Failed to create contact');
        },
      },
    },
    queryClient,
  );

  const updateContactMutation = useUpdateContactEndpoint(
    {
      mutation: {
        onSuccess: () => {
          toast.success('Contact updated successfully');
          setEditDialogOpen(false);
          setSelectedRecipient(null);
          queryClient.invalidateQueries({ queryKey: listQueryKey });
        },
        onError: (err) => {
          console.error('Failed to update contact:', err);
          toast.error('Failed to update contact');
        },
      },
    },
    queryClient,
  );

  const deleteContactMutation = useDeleteContactEndpoint(
    {
      mutation: {
        onSuccess: () => {
          toast.success('Contact deleted successfully');
          setDeleteDialogOpen(false);
          setSelectedRecipient(null);
          queryClient.invalidateQueries({ queryKey: listQueryKey });
        },
        onError: (err) => {
          console.error('Failed to delete contact:', err);
          toast.error('Failed to delete contact');
        },
      },
    },
    queryClient,
  );

  useEffect(() => {
    if (contactsQuery.isError) {
      console.error('Failed to load contacts:', contactsQuery.error);
      toast.error('Failed to load contacts');
    }
  }, [contactsQuery.error, contactsQuery.isError]);

  const contacts = (contactsQuery.data?.items as ContactRecord[] | undefined)?.map((c) => ({
    ...c,
    id: c.id ?? '',
    organizationId: c.organizationId ?? selectedOrg?.id ?? '',
  })) as Contact[] | undefined;

  async function createRecipient(values: ContactFormValues) {
    if (!selectedOrg) return;
    const payload: ContactUpsertRequest = {
      email: values.email ?? null,
      firstName: values.firstName ?? null,
      lastName: values.lastName ?? null,
      externalId: values.externalId ?? null,
      attributes: values.attributes ?? {},
    };
    try {
      await createContactMutation.mutateAsync({ data: payload });
    } catch {
      // handled by onError
    }
  }

  async function updateRecipient(values: ContactFormValues) {
    if (!selectedOrg || !selectedRecipient) return;
    const payload: UpdateContactRequest = {
      email: values.email ?? null,
      firstName: values.firstName ?? null,
      lastName: values.lastName ?? null,
      externalId: values.externalId ?? null,
      attributes: values.attributes ?? {},
    };
    try {
      await updateContactMutation.mutateAsync({
        id: selectedRecipient.id,
        data: payload,
      });
    } catch {
      // handled by onError
    }
  }

  async function deleteRecipient() {
    if (!selectedOrg || !selectedRecipient) return;
    try {
      await deleteContactMutation.mutateAsync({
        data: { id: selectedRecipient.id },
      });
    } catch {
      // handled by onError
    }
  }

  function openEditDialog(recipient: Contact) {
    setSelectedRecipient(recipient);
    setEditDialogOpen(true);
  }

  function openDeleteDialog(recipient: Contact) {
    setSelectedRecipient(recipient);
    setDeleteDialogOpen(true);
  }

  function handleExport() {
    if (!contacts || contacts.length === 0) {
      toast.error('No contacts to export');
      return;
    }

    const csvContent = [
      ['Email', 'First Name', 'Last Name', 'External ID', 'Attributes'].join(','),
      ...contacts.map((r) =>
        [
          r.email || '',
          r.firstName || '',
          r.lastName || '',
          r.externalId || '',
          JSON.stringify(r.attributes || {}),
        ].join(','),
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Contacts exported successfully');
  }

  function handleImport() {
    toast.info('CSV import coming soon');
  }

  const selectedRecipientDetails =
    contactDetailsQuery.data && selectedRecipient
      ? {
          ...contactDetailsQuery.data,
          id: selectedRecipient.id,
          organizationId: selectedRecipient.organizationId,
        }
      : selectedRecipient;

  return (
    <div className="space-y-6">
      <RecipientsHeader
        onExport={handleExport}
        onImport={handleImport}
        onOpenCreate={() => setCreateDialogOpen(true)}
      />

      <RecipientsSearchCard value={searchQuery} onChange={setSearchQuery} />

      <RecipientsTable
        recipients={contacts || []}
        loading={contactsQuery.isLoading || contactsQuery.isFetching}
        searchQuery={searchQuery}
        onEdit={openEditDialog}
        onDelete={openDeleteDialog}
        onCreateFirst={() => setCreateDialogOpen(true)}
      />

      <RecipientFormDialog
        mode="create"
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            setSelectedRecipient(null);
          }
        }}
        onSubmit={createRecipient}
      />

      <RecipientFormDialog
        mode="edit"
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setSelectedRecipient(null);
          }
        }}
        recipient={selectedRecipientDetails || null}
        onSubmit={updateRecipient}
      />

      <DeleteRecipientDialog
        open={deleteDialogOpen}
        recipient={selectedRecipient}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setSelectedRecipient(null);
        }}
        onConfirm={deleteRecipient}
      />
    </div>
  );
}
