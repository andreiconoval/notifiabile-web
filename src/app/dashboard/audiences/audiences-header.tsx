'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';

interface AudiencesHeaderProps {
  onImport: () => void;
  onCreate: () => void;
}

export default function AudiencesHeader({ onImport, onCreate }: AudiencesHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl text-gray-900 mb-2">Audiences & Segments</h1>
        <p className="text-gray-600">Manage recipient groups and segments</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onImport}>
          <Upload className="h-4 w-4 mr-2" />
          Import CSV
        </Button>
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Audience
        </Button>
      </div>
    </div>
  );
}
