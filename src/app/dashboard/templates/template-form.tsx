'use client';

import React, { forwardRef, useEffect, useImperativeHandle } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  emptyTemplateFormValues,
  TemplateFormHandle,
  TemplateFormProps,
  TemplateFormValues,
} from './types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NotificationChannelType } from '@/api/generated/schemas';

export const TemplateForm = forwardRef<TemplateFormHandle, TemplateFormProps>(
  ({ initialValues, statusOptions, languageOptions, mode = 'edit', onChange }, ref) => {
    const form = useForm<TemplateFormValues>({
      defaultValues: {
        ...emptyTemplateFormValues,
        ...initialValues,
      },
    });

    const {
      control,
      watch,
      trigger,
      getValues,
      reset,
      formState: { isDirty, isSubmitting },
    } = form;

    const {
      fields: pushDataFields,
      append,
      remove,
    } = useFieldArray({
      control,
      name: 'pushData',
    });

    const isExternal = watch('isExternal');
    const channelType = watch('channelType');

    // Expose imperative API to parent
    useImperativeHandle(
      ref,
      (): TemplateFormHandle => ({
        validate: async () => {
          const ok = await trigger();
          return ok;
        },
        getValues: () => getValues(),
        reset: (values) =>
          reset({
            ...emptyTemplateFormValues,
            ...values,
          }),
      }),
      [trigger, getValues, reset],
    );

    // Notify parent on change
    const allValues = watch();
    useEffect(() => {
      if (onChange) {
        onChange(allValues, isDirty);
      }
    }, [allValues, isDirty, onChange]);

    // This form does NOT submit itself – parent controls validate & save
    const preventSubmit = (e: React.FormEvent) => {
      e.preventDefault();
    };

    return (
      <Form {...form}>
        <div className="space-y-4 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={control}
              name="code"
              rules={{ required: 'Code is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Code</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Channel type</FormLabel>
              <FormControl>
                <Input value={channelType ?? ''} readOnly disabled />
              </FormControl>
            </FormItem>

            <FormField
              control={control}
              name="status"
              rules={{ required: 'Status is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value as any}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status…" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((opt) => (
                          <SelectItem key={String(opt.value)} value={String(opt.value)}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="language"
              rules={{ required: 'Language is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language…" />
                      </SelectTrigger>
                      <SelectContent>
                        {languageOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {/* External settings */}
          <div className="rounded-md border p-4 space-y-3">
            <FormField
              control={control}
              name="isExternal"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(Boolean(v))}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Use external provider template</FormLabel>
                    <FormDescription>
                      When enabled, this template will be resolved via an external provider (e.g.
                      SendGrid, Mailjet).
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {isExternal && (
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={control}
                  name="externalProvider"
                  rules={{
                    required: 'External provider is required when external is enabled',
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>External provider</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="externalTemplateId"
                  rules={{
                    required: 'External template ID is required when external is enabled',
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>External template ID</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>

          {/* Email content */}
          {!isExternal && channelType == NotificationChannelType.Email && (
            <div className="rounded-md border p-4 space-y-3">
              <h3 className="text-sm font-semibold">
                Email content
                {mode === 'create' && (
                  <span className="ml-1 text-xs text-muted-foreground"> (optional)</span>
                )}
              </h3>

              <FormField
                control={control}
                name="emailSubject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email subject</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="emailText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email text (plain)</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[60px]" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="emailHtml"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email HTML</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[120px] font-mono text-xs" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* SMS content */}
          {!isExternal && channelType == NotificationChannelType.Sms && (
            <div className="rounded-md border p-4 space-y-3">
              <h3 className="text-sm font-semibold">SMS content</h3>
              <FormField
                control={control}
                name="smsText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SMS text</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[60px]" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Push content */}
          {!isExternal && channelType == NotificationChannelType.Push && (
            <div className="rounded-md border p-4 space-y-3">
              <h3 className="text-sm font-semibold">Push content</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={control}
                  name="pushTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Push title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="pushBody"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Push body</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[60px]" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Push data (key/value)</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ key: '', value: '' })}
                  >
                    + Add pair
                  </Button>
                </div>

                {pushDataFields.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No push data. Click &quot;Add pair&quot; to add one.
                  </p>
                )}

                <div className="space-y-2">
                  {pushDataFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <FormField
                        control={control}
                        name={`pushData.${index}.key`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="sr-only">Key</FormLabel>
                            <FormControl>
                              <Input placeholder="key" className="text-xs" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name={`pushData.${index}.value`}
                        render={({ field }) => (
                          <FormItem className="flex-[2]">
                            <FormLabel className="sr-only">Value</FormLabel>
                            <FormControl>
                              <Input placeholder="value" className="text-xs" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 text-xs"
                        onClick={() => remove(index)}
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {/* No submit button here – parent decides */}
          {isSubmitting && <p className="text-xs text-muted-foreground">Validating…</p>}
        </div>
      </Form>
    );
  },
);

TemplateForm.displayName = 'TemplateForm';
