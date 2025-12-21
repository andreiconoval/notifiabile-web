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
import { Trash2, Plus } from 'lucide-react';
import { CustomAttribute, Contact, ContactFormValues } from './types';

type RecipientFormDialogMode = 'create' | 'edit';

interface RecipientFormDialogProps {
  mode: RecipientFormDialogMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipient?: Contact | null;
  onSubmit: (values: ContactFormValues) => void | Promise<void>;
}

export default function RecipientFormDialog({
  mode,
  open,
  onOpenChange,
  recipient,
  onSubmit,
}: RecipientFormDialogProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [externalId, setExternalId] = useState('');
  const [customAttributes, setCustomAttributes] = useState<CustomAttribute[]>([]);

  const dialogTitle = useMemo(
    () => (mode === 'create' ? 'Add New Recipient' : 'Edit Recipient'),
    [mode],
  );

  const dialogDescription = useMemo(
    () =>
      mode === 'create'
        ? 'Add a new recipient to your organization'
        : 'Update recipient information',
    [mode],
  );

  useEffect(() => {
    if (open) {
      setEmail(recipient?.email || '');
      setFirstName(recipient?.firstName || '');
      setLastName(recipient?.lastName || '');
      setExternalId(recipient?.externalId || '');
      const attributes = Object.entries(recipient?.attributes || {}).map(([key, value]) => ({
        key,
        value: value ?? '',
      }));
      setCustomAttributes(attributes);
    } else {
      resetForm();
    }
  }, [open, recipient]);

  function resetForm() {
    setEmail('');
    setFirstName('');
    setLastName('');
    setExternalId('');
    setCustomAttributes([]);
  }

  function addCustomAttribute() {
    setCustomAttributes((prev) => [...prev, { key: '', value: '' }]);
  }

  function updateCustomAttribute(index: number, field: keyof CustomAttribute, value: string) {
    setCustomAttributes((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function removeCustomAttribute(index: number) {
    setCustomAttributes((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const attributes: Record<string, string> = {};
    customAttributes.forEach((attr) => {
      if (attr.key && attr.value) {
        attributes[attr.key] = attr.value;
      }
    });
    onSubmit({
      email,
      firstName,
      lastName,
      externalId,
      attributes,
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
              <Label htmlFor={`${mode}-email`}>Email Address</Label>
              <Input
                id={`${mode}-email`}
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor={`${mode}-first-name`}>First Name</Label>
                <Input
                  id={`${mode}-first-name`}
                  name="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${mode}-last-name`}>Last Name</Label>
                <Input
                  id={`${mode}-last-name`}
                  name="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${mode}-external-id`}>External ID</Label>
              <Input
                id={`${mode}-external-id`}
                name="externalId"
                value={externalId}
                onChange={(e) => setExternalId(e.target.value)}
                placeholder="crm-123"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Custom Attributes</Label>
                <Button type="button" size="sm" variant="outline" onClick={addCustomAttribute}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Attribute
                </Button>
              </div>
              {customAttributes.map((attr, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Key (e.g., tier)"
                    value={attr.key}
                    onChange={(e) => updateCustomAttribute(index, 'key', e.target.value)}
                  />
                  <Input
                    placeholder="Value (e.g., premium)"
                    value={attr.value}
                    onChange={(e) => updateCustomAttribute(index, 'value', e.target.value)}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeCustomAttribute(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {customAttributes.length === 0 && (
                <p className="text-xs text-gray-500">No custom attributes added</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">{mode === 'create' ? 'Create Recipient' : 'Update Recipient'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
