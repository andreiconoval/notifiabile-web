import type { ContactRecord } from '@/api/generated/schemas';

export type Contact = ContactRecord & { id: string; organizationId: string };

export interface ContactFormValues {
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  externalId?: string | null;
  attributes: Record<string, string>;
}

export interface CustomAttribute {
  key: string;
  value: string;
}
