'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Audience, AudienceContact } from './types';
import { Checkbox } from '@/components/ui/checkbox';

interface ManageRecipientsDialogProps {
  open: boolean;
  audience?: Audience | null;
  recipients: AudienceContact[];
  selectedRecipientIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ManageRecipientsDialog({
  open,
  audience,
  recipients,
  selectedRecipientIds,
  onSelectionChange,
  onClose,
  onConfirm,
}: ManageRecipientsDialogProps) {
  function toggleRecipientSelection(recipientId: string) {
    onSelectionChange(
      selectedRecipientIds.includes(recipientId)
        ? selectedRecipientIds.filter((id) => id !== recipientId)
        : [...selectedRecipientIds, recipientId],
    );
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Recipients</DialogTitle>
          <DialogDescription>Select recipients to include in {audience?.name}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                {selectedRecipientIds.length} of {recipients.length} selected
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onSelectionChange(recipients.map((r) => r.id ?? ''))}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onSelectionChange([])}
                >
                  Clear All
                </Button>
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>External ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipients.map((recipient) => (
                    <TableRow key={recipient.id || recipient.email}>
                      <TableCell>
                        <Checkbox
                          checked={
                            recipient.id ? selectedRecipientIds.includes(recipient.id) : false
                          }
                          onCheckedChange={() =>
                            recipient.id && toggleRecipientSelection(recipient.id)
                          }
                        />
                      </TableCell>
                      <TableCell>{recipient.email || '-'}</TableCell>
                      <TableCell>
                        {[recipient.firstName, recipient.lastName].filter(Boolean).join(' ') || '-'}
                      </TableCell>
                      <TableCell>{recipient.externalId || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Update Recipients</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
