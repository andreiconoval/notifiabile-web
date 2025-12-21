'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Audience } from './types';

interface DeleteAudienceDialogProps {
  open: boolean;
  audience?: Audience | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteAudienceDialog({
  open,
  audience,
  onCancel,
  onConfirm,
}: DeleteAudienceDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Audience</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{audience?.name}"? This action cannot be undone. This
            will not delete the recipients themselves, only the audience grouping.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
