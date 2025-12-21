import {
  NotificationChannelType,
  // TemplateContentDtoPushData,
  TemplateResponse,
  TemplateStatus,
  TemplateUpdateRequest,
  TemplateCreateRequest,
} from '@/api/generated/schemas';

export interface TemplateFormValues {
  code: string;
  status: TemplateStatus | '';
  language: string;
  isExternal: boolean;
  externalProvider: string;
  externalTemplateId: string;
  channelType?: NotificationChannelType;

  emailSubject: string;
  emailHtml: string;
  emailText: string;

  smsText: string;

  pushTitle: string;
  pushBody: string;
  pushData: { key: string; value: string }[];
}

export interface TemplateFormProps {
  initialValues?: Partial<TemplateFormValues>;
  statusOptions: { value: TemplateStatus; label: string }[];
  languageOptions: { value: string; label: string }[];

  /** Read-only channel type label / value to show */

  mode?: 'create' | 'edit';

  /** Called when values change */
  onChange?: (values: TemplateFormValues, isDirty: boolean) => void;
}

export interface TemplateFormHandle {
  validate: () => Promise<boolean>;
  getValues: () => TemplateFormValues;
  reset: (values?: Partial<TemplateFormValues>) => void;
}

export const emptyTemplateFormValues: TemplateFormValues = {
  code: '',
  status: '',
  language: '',
  isExternal: false,
  externalProvider: '',
  externalTemplateId: '',
  channelType: undefined,
  emailSubject: '',
  emailHtml: '',
  emailText: '',

  smsText: '',

  pushTitle: '',
  pushBody: '',
  pushData: [],
};

export const mapTemplateToFormValuesFromResponse = (t: TemplateResponse): TemplateFormValues => {
  const content = t.content ?? {};
  // const pushDataArray = content.pushData
  //   ? Object.entries(content.pushData).map(([key, value]) => ({
  //       key,
  //       value,
  //     }))
  //   : [];

  return {
    ...emptyTemplateFormValues,
    code: t.code ?? '',
    status: (t.status as TemplateStatus) ?? '',
    language: t.language ?? '',
    channelType: t.channelType ?? undefined,
    isExternal: t.isExternal ?? false,
    externalProvider: t.externalProvider ?? '',
    externalTemplateId: t.externalTemplateId ?? '',
    emailSubject: content.emailSubject ?? '',
    emailHtml: content.emailHtml ?? '',
    emailText: content.emailText ?? '',
    smsText: content.smsText ?? '',
    pushTitle: content.pushTitle ?? '',
    pushBody: content.pushBody ?? '',
    // pushData: pushDataArray,
  };
};

export const mapFormValuesToTemplateUpdateRequest = (
  base: TemplateUpdateRequest,
  values: TemplateFormValues,
): TemplateUpdateRequest => {
  // const pushData: TemplateContentDtoPushData =
  //   values.pushData && values.pushData.length > 0
  //     ? values.pushData.reduce<Record<string, string>>((acc, pair) => {
  //         const key = pair.key.trim();
  //         if (key) acc[key] = pair.value;
  //         return acc;
  //       }, {})
  //     : null;

  return {
    ...base,
    code: values.code || undefined,
    status: values.status || undefined,
    language: values.language || undefined,
    isExternal: values.isExternal,
    externalProvider: values.isExternal ? values.externalProvider || null : null,
    externalTemplateId: values.isExternal ? values.externalTemplateId || null : null,
    content: {
      emailSubject: values.emailSubject || null,
      emailHtml: values.emailHtml || null,
      emailText: values.emailText || null,
      smsText: values.smsText || null,
      pushTitle: values.pushTitle || null,
      pushBody: values.pushBody || null,
      // pushData,
    },
  };
};

export const mapFormValuesToTemplateCreateRequest = (
  base: TemplateCreateRequest,
  values: TemplateFormValues,
): TemplateCreateRequest => {
  // const pushData: TemplateContentDtoPushData =
  //   values.pushData && values.pushData.length > 0
  //     ? values.pushData.reduce<Record<string, string>>((acc, pair) => {
  //         const key = pair.key.trim();
  //         if (key) acc[key] = pair.value;
  //         return acc;
  //       }, {})
  //     : null;

  return {
    ...base,
    code: values.code || undefined,
    language: values.language || undefined,
    channelType: values.channelType,
    isExternal: values.isExternal,
    externalProvider: values.isExternal ? values.externalProvider || null : null,
    externalTemplateId: values.isExternal ? values.externalTemplateId || null : null,
    content: {
      emailSubject: values.emailSubject || null,
      emailHtml: values.emailHtml || null,
      emailText: values.emailText || null,
      smsText: values.smsText || null,
      pushTitle: values.pushTitle || null,
      pushBody: values.pushBody || null,
      // pushData,
    },
  };
};
