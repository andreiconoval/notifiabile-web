'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Filter, Trash2, UserPlus } from 'lucide-react';
import { Audience } from './types';

interface AudienceCardProps {
  audience: Audience;
  recipientsCount: number;
  onManageRecipients: (audience: Audience) => void;
  onEdit: (audience: Audience) => void;
  onDelete: (audience: Audience) => void;
}

export default function AudienceCard({
  audience,
  recipientsCount,
  onManageRecipients,
  onEdit,
  onDelete,
}: AudienceCardProps) {
  const formatOperatorLabel = (operator?: string) => {
    switch (operator) {
      case 'equals':
        return 'Equals';
      case 'not_equals':
        return 'Not equals';
      case 'contains':
        return 'Contains';
      case 'not_contains':
        return 'Not contains';
      case 'starts_with':
        return 'Starts with';
      case 'ends_with':
        return 'Ends with';
      default:
        return operator || 'Equals';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{audience.name}</CardTitle>
            <CardDescription className="mt-1">
              {audience.description || 'No description'}
            </CardDescription>
          </div>
          <Badge variant={audience.type === 'dynamic' ? 'default' : 'secondary'}>
            {audience.type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Recipients</span>
            <span className="text-lg">{recipientsCount.toLocaleString()}</span>
          </div>

          {audience.type === 'dynamic' && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-900 mb-2">Segment rules:</p>
              {audience.filterExpressions?.length ? (
                <div className="space-y-2">
                  {audience.filterExpressions.map((rule, index) => (
                    <div
                      key={`${rule.field ?? 'rule'}-${index}`}
                      className="flex items-center gap-2 text-xs text-blue-800 bg-white/70 border border-blue-100 rounded-md px-3 py-2"
                    >
                      <span className="font-semibold">{rule.field || 'Attribute'}</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 uppercase tracking-wide text-[10px]">
                        {formatOperatorLabel(rule.operator)}
                      </span>
                      <span className="px-2 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-900">
                        {rule.value ?? 'Any'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-blue-700">No rules defined yet.</p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Created</span>
            <span>{audience.created ? new Date(audience.created).toLocaleDateString() : '-'}</span>
          </div>

          <div className="flex gap-2 mt-4">
            {audience.type === 'static' && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onManageRecipients(audience)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Manage
              </Button>
            )}
            {audience.type === 'dynamic' && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onEdit(audience)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Edit Rules
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => onEdit(audience)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => onDelete(audience)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
