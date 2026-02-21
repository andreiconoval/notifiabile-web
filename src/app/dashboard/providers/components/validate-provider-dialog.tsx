'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, FlaskConical, Loader2, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useValidateProviderEndpoint } from '@/api/generated/notifiable.web';
import type { ValidateProviderResponse } from '@/api/generated/schemas';
import type { Provider } from '../types';
import { useAuth } from '@/contexts/AuthContext';

type ValidateProviderDialogProps = {
  provider: Provider;
  trigger?: React.ReactNode;
};

export function ValidateProviderDialog({ provider, trigger }: ValidateProviderDialogProps) {
  const { selectedOrg } = useAuth();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<ValidateProviderResponse | null>(null);
  const { mutate: validate, isPending } = useValidateProviderEndpoint({
    mutation: {
      onSuccess: (data) => {
        setResult(data);
        if (data.isValid) {
          toast.success('Provider validation passed');
        } else {
          toast.error(data.message ?? 'Provider validation failed');
        }
      },
      onError: () => {
        toast.error('Failed to validate provider');
      },
    },
  });

  const handleOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setResult(null);
      if (provider.id) {
        validate({ id: provider.id, data: { organizationId: selectedOrg?.id } });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Validate Provider</DialogTitle>
          <DialogDescription>
            Testing credentials and settings for {provider.displayName}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isPending && (
            <div className="flex flex-col items-center justify-center gap-3 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Running validation checks...</p>
            </div>
          )}

          {!isPending && result && (
            <div className="space-y-4">
              <div
                className={`flex items-center gap-3 rounded-lg border p-4 ${
                  result.isValid
                    ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
                    : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'
                }`}
              >
                {result.isValid ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
                )}
                <div>
                  <p
                    className={`font-medium ${
                      result.isValid
                        ? 'text-green-900 dark:text-green-100'
                        : 'text-red-900 dark:text-red-100'
                    }`}
                  >
                    {result.isValid ? 'All checks passed' : 'Validation failed'}
                  </p>
                  {result.message && (
                    <p
                      className={`text-sm mt-0.5 ${
                        result.isValid
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-red-700 dark:text-red-300'
                      }`}
                    >
                      {result.message}
                    </p>
                  )}
                </div>
              </div>

              {result.checks && result.checks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Checks</h4>
                  <div className="space-y-1.5">
                    {result.checks.map((check, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 rounded-md border px-3 py-2 text-sm"
                      >
                        {check.passed ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium">{check.name}</p>
                          {check.detail && (
                            <p className="text-muted-foreground text-xs mt-0.5">{check.detail}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  if (provider.id) {
                    setResult(null);
                    validate({ id: provider.id, data: { organizationId: selectedOrg?.id } });
                  }
                }}
              >
                <FlaskConical className="h-4 w-4 mr-2" />
                Re-run Validation
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
