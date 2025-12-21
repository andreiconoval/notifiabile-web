import type {
  AudienceFilterRule,
  AudienceGroupDto,
  AudienceType as ApiAudienceType,
  ContactRecord,
} from '@/api/generated/schemas';

export type AudienceType = ApiAudienceType;

export type DynamicRule = AudienceFilterRule & {
  field: string;
  operator: string;
  value: string;
};

export interface Audience extends AudienceGroupDto {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  type: AudienceType;
  filterExpressions?: AudienceFilterRule[] | null;
  created?: string;
  updated?: string;
}

export interface AudienceFormValues {
  name: string;
  description?: string;
  type: AudienceType;
  filterExpressions?: DynamicRule[];
}

export type AudienceContact = ContactRecord;
