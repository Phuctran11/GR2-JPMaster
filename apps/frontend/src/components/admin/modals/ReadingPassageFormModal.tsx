import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { AdminCloudinaryAsset, AdminJlptExam } from '../../../services/api';
import { inputClass } from '../adminClasses';
import type { AdminReadingPassageFormValues } from '../adminFormTypes';
import { jlptLevelOptions } from '../adminOptions';
import { AssetUploader, Field, Modal, ModalActions } from '../DashboardUi';

export function ReadingPassageFormModal({
  editingReadingPassageId,
  selectedJlptExam,
  busy,
  initialValues,
  uploadingField,
  onUpload,
  onSubmit,
  onClose,
}: {
  editingReadingPassageId: number | null;
  selectedJlptExam: AdminJlptExam | null;
  busy: boolean;
  initialValues: AdminReadingPassageFormValues;
  uploadingField: string | null;
  onUpload: (file: File, mediaKind: 'image' | 'video' | 'audio', scope: string, fieldKey: string) => Promise<AdminCloudinaryAsset>;
  onSubmit: (values: AdminReadingPassageFormValues) => void;
  onClose: () => void;
}) {
  const { register, handleSubmit, reset, watch, setValue } = useForm<AdminReadingPassageFormValues>({
    defaultValues: initialValues,
    mode: 'onBlur',
  });
  const form = watch();

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  return (
    <Modal title={editingReadingPassageId ? 'Edit Reading Passage' : 'Create Reading Passage'} subtitle={selectedJlptExam?.title || 'JLPT reading'} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Title"><input className={inputClass} {...register('title')} /></Field>
        <Field label="JLPT Level">
          <select className={inputClass} {...register('jlpt_level')}>
            {jlptLevelOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </Field>
        <Field label="Passage Text"><textarea className={inputClass} rows={8} {...register('passage_text')} /></Field>
        <AssetUploader
          label="Passage Image"
          accept="image/*"
          previewUrl={form.image_url}
          mediaKind="image"
          scope="reading-passages"
          fieldKey="reading-passage-image"
          uploadingField={uploadingField}
          onUpload={onUpload}
          onUploaded={(asset) => {
            setValue('image_asset_id', asset.asset_id);
            setValue('image_url', asset.secure_url);
          }}
        />
        <ModalActions busy={busy} submitLabel={editingReadingPassageId ? 'Save Passage' : 'Create Passage'} onCancel={onClose} />
      </form>
    </Modal>
  );
}

