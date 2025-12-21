'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { Audience, AudienceFormValues, AudienceType, DynamicRule } from './types';

interface AudienceFormDialogProps {
  mode: 'create' | 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audience?: Audience | null;
  onSubmit: (values: AudienceFormValues) => void | Promise<void>;
}

const defaultRule: DynamicRule = { field: '', operator: 'equals', value: '' };

export default function AudienceFormDialog({
  mode,
  open,
  onOpenChange,
  audience,
  onSubmit,
}: AudienceFormDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<AudienceType>('static');
  const [dynamicRules, setDynamicRules] = useState<DynamicRule[]>([defaultRule]);
  const isDynamic = type === 'dynamic';

  const dialogTitle = useMemo(
    () => (mode === 'create' ? 'Create Audience' : 'Edit Audience'),
    [mode],
  );

  const dialogDescription = useMemo(
    () =>
      mode === 'create'
        ? 'Create a new audience segment for targeted campaigns'
        : 'Update audience details and rules',
    [mode],
  );

  useEffect(() => {
    if (open) {
      const audienceType = (audience?.type as AudienceType) || 'static';
      setName(audience?.name || '');
      setDescription(audience?.description || '');
      setType(audienceType);
      setDynamicRules(
        audienceType === 'dynamic' && audience?.filterExpressions?.length
          ? audience.filterExpressions.map((rule) => ({
              field: rule.field ?? '',
              operator: rule.operator ?? 'equals',
              value: rule.value ?? '',
            }))
          : [defaultRule],
      );
    } else if (!open && mode === 'create') {
      resetForm();
    }
  }, [open, audience, mode]);

  function resetForm() {
    setName('');
    setDescription('');
    setType('static');
    setDynamicRules([defaultRule]);
  }

  function addDynamicRule() {
    setDynamicRules((prev) => [...prev, { ...defaultRule }]);
  }

  function updateDynamicRule(index: number, field: keyof DynamicRule, value: string) {
    setDynamicRules((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function removeDynamicRule(index: number) {
    setDynamicRules((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const normalizedRules = dynamicRules
      .map((rule) => ({
        field: rule.field.trim(),
        operator: rule.operator,
        value: rule.value.trim(),
      }))
      .filter((rule) => rule.field && rule.value);

    onSubmit({
      name,
      description,
      type,
      filterExpressions: isDynamic && normalizedRules.length > 0 ? normalizedRules : undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor={`${mode}-name`}>Audience Name</Label>
              <Input
                id={`${mode}-name`}
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Premium Customers"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${mode}-description`}>Description</Label>
              <Textarea
                id={`${mode}-description`}
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Customers with premium subscription"
                rows={3}
              />
            </div>
            {mode === 'create' && (
              <div className="space-y-2">
                <Label htmlFor={`${mode}-type`}>Audience Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as AudienceType)}>
                  <SelectTrigger id={`${mode}-type`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="static">Static List</SelectItem>
                    <SelectItem value="dynamic">Dynamic Segment</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {type === 'static'
                    ? 'Fixed list of recipients - manually select who to include'
                    : 'Automatically updated based on rules and criteria'}
                </p>
              </div>
            )}

            {isDynamic && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Segment Rules</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addDynamicRule}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Rule
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Define rules to automatically include recipients matching these criteria
                </p>
                {dynamicRules.map((rule, index) => (
                  <div
                    key={`${rule.field}-${index}`}
                    className="flex gap-2 items-start p-3 border rounded-lg"
                  >
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Attribute (e.g., tier, location, status)"
                        value={rule.field}
                        onChange={(e) => updateDynamicRule(index, 'field', e.target.value)}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          value={rule.operator}
                          onValueChange={(v) => updateDynamicRule(index, 'operator', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Equals</SelectItem>
                            <SelectItem value="not_equals">Not Equals</SelectItem>
                            <SelectItem value="contains">Contains</SelectItem>
                            <SelectItem value="not_contains">Not Contains</SelectItem>
                            <SelectItem value="starts_with">Starts With</SelectItem>
                            <SelectItem value="ends_with">Ends With</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Value"
                          value={rule.value}
                          onChange={(e) => updateDynamicRule(index, 'value', e.target.value)}
                        />
                      </div>
                    </div>
                    {dynamicRules.length > 1 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeDynamicRule(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                if (mode === 'create') {
                  resetForm();
                }
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {mode === 'create' ? 'Create Audience' : 'Update Audience'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
