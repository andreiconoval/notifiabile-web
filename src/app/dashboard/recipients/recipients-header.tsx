'use client';

import { Button } from '@/components/ui/button';
import { Download, Plus, Upload } from 'lucide-react';
import React from 'react';

interface RecipientsHeaderProps {
  onExport: () => void;
  onImport: () => void;
  onOpenCreate: () => void;
}

export default function RecipientsHeader({
  onExport,
  onImport,
  onOpenCreate,
}: RecipientsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl text-gray-900 mb-2">Contacts</h1>
        <p className="text-gray-600">Manage individual contacts and their delivery details</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        <Button variant="outline" onClick={onImport}>
          <Upload className="h-4 w-4 mr-2" />
          Import CSV
        </Button>
        <Button onClick={onOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Recipient
        </Button>
      </div>
    </div>
  );
}
