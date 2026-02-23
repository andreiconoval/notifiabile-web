import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Save, Trash2 } from 'lucide-react';
import { TemplateResponse } from '@/api/generated/schemas';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRef, useState } from 'react';
import {
  mapFormValuesToTemplateUpdateRequest,
  mapTemplateToFormValuesFromResponse,
  TemplateFormHandle,
} from './types';
import { TemplateForm } from './template-form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  getGetTemplateListEndpointQueryKey,
  useDeleteTemplateEndpoint,
  useUpdateTemplateEndpoint,
} from '@/api/generated/notifiable.web';

export default function UpdateTemplateDialog({
  onTemplateUpdated,
  children: trigger,
  template: editTemplate,
}: {
  onTemplateUpdated?: () => void;
  children?: React.ReactNode;
  template: TemplateResponse;
}) {
  const formRef = useRef<TemplateFormHandle | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const initialFormValues = mapTemplateToFormValuesFromResponse(editTemplate);

  const queryClient = useQueryClient();
  const { mutateAsync: updateTemplate, isError } = useUpdateTemplateEndpoint();
  const { mutateAsync: deleteTemplateMutation } = useDeleteTemplateEndpoint();

  const handleSave = async () => {
    if (!formRef.current) return;

    const isValid = await formRef.current.validate();
    if (!isValid) return;

    const values = formRef.current.getValues();

    const payload = mapFormValuesToTemplateUpdateRequest(editTemplate, values);

    try {
      var response = await updateTemplate({
        data: payload,
        id: editTemplate.id ?? '',
      });

      if (isError) {
        toast.error('Failed to update template');
        return;
      }

      toast.success('Template updated successfully');
      await queryClient.invalidateQueries({
        queryKey: getGetTemplateListEndpointQueryKey(),
      });
      setUpdateDialogOpen(false);
      onTemplateUpdated?.();
    } catch (error) {
      console.error('Failed to update template:', error);
      toast.error('Failed to update template');
    }
  };

  async function deleteTemplate(id: string) {
    if (!editTemplate) return;
    try {
      await deleteTemplateMutation({ id, data: {} });
      toast.success('Template deleted successfully');
      await queryClient.invalidateQueries({
        queryKey: getGetTemplateListEndpointQueryKey(),
      });
      setDeleteConfirmId(null);
      setUpdateDialogOpen(false);
      onTemplateUpdated?.();
    } catch (err) {
      console.error('Failed to delete template:', err);
      toast.error('Failed to delete template');
    }
  }

  return (
    <>
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogTrigger asChild>
          {trigger ?? <Button>Edit Template</Button>}
        </DialogTrigger>

        {/* only width + remove default padding so we can control layout */}
        <DialogContent className="max-w-3xl p-0">
          {/* this container defines the dialog height and layout */}
          <div className="flex h-[80vh] flex-col">
            {/* HEADER */}
            <div className="px-6 pt-6">
              <DialogHeader>
                <DialogTitle>Update Template</DialogTitle>
                <DialogDescription>
                  Edit template details, change status, or delete
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <TemplateForm
                ref={formRef}
                initialValues={initialFormValues}
                statusOptions={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'published', label: 'Published' },
                  { value: 'archived', label: 'Archived' },
                ]}
                languageOptions={[{ value: 'en', label: 'English' }]}
                mode="edit"
              />
              <div className="border-t pt-4">
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDeleteConfirmId(editTemplate.id ?? null);
                  }}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Template
                </Button>
              </div>
            </div>

            <div className="border-t px-6 py-4">
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the template and it will no
              longer be available for campaigns.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && deleteTemplate(deleteConfirmId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
