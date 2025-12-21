'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit, Plus, Trash2, Users } from 'lucide-react';
import { Contact } from './types';

interface RecipientsTableProps {
  recipients: Contact[];
  loading: boolean;
  searchQuery: string;
  onEdit: (recipient: Contact) => void;
  onDelete: (recipient: Contact) => void;
  onCreateFirst: () => void;
}

export default function RecipientsTable({
  recipients,
  loading,
  searchQuery,
  onEdit,
  onDelete,
  onCreateFirst,
}: RecipientsTableProps) {
  const recipientCountLabel = `${recipients.length} Contact${recipients.length !== 1 ? 's' : ''}`;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recipients.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg mb-2">{searchQuery ? 'No contacts found' : 'No contacts yet'}</h3>
          <p className="text-sm text-gray-600 mb-4 text-center max-w-md">
            {searchQuery
              ? 'Try adjusting your search query'
              : 'Add contacts individually or import from CSV to get started'}
          </p>
          {!searchQuery && (
            <Button onClick={onCreateFirst}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Contact
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{recipientCountLabel}</CardTitle>
        <CardDescription>{searchQuery && `Showing results for "${searchQuery}"`}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>External ID</TableHead>
                <TableHead>Attributes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipients.map((recipient, index) => (
                <TableRow
                  key={recipient.id || recipient.email || recipient.externalId || `contact-${index}`}
                >
                  <TableCell>{recipient.email || '-'}</TableCell>
                  <TableCell>
                    {[recipient.firstName, recipient.lastName].filter(Boolean).join(' ') || '-'}
                  </TableCell>
                  <TableCell>{recipient.externalId || '-'}</TableCell>
                  <TableCell>
                    {recipient.attributes && Object.keys(recipient.attributes).length > 0 ? (
                      <span className="text-xs text-gray-600">
                        {Object.keys(recipient.attributes).length} attribute
                        {Object.keys(recipient.attributes).length !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">None</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => onEdit(recipient)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onDelete(recipient)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
