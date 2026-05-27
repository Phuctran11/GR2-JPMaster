import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { AdminCloudinaryAsset, AdminJlptExam, AdminJlptSection, AdminSectionType } from '../../../services/api';
import { dangerButtonClass, inputClass } from '../adminClasses';
import type { AdminJlptSectionFormValues } from '../adminFormTypes';
import { sectionTypeOptions } from '../adminOptions';
import { AssetUploader, Field, Modal, ModalActions } from '../DashboardUi';

export function JlptSectionFormModal({
  editingJlptSectionId,
  selectedJlptExam,
  sections,
  busy,
  initialValues,
  uploadingField,
  onUpload,
  onSubmit,
  onClose,
  onDelete,
}: {
  editingJlptSectionId: number | null;
  selectedJlptExam: AdminJlptExam | null;
  sections: AdminJlptSection[];
  busy: boolean;
  initialValues: AdminJlptSectionFormValues;
  uploadingField: string | null;
  onUpload: (file: File, mediaKind: 'image' | 'video' | 'audio', scope: string, fieldKey: string) => Promise<AdminCloudinaryAsset>;
  onSubmit: (values: AdminJlptSectionFormValues) => void;
  onClose: () => void;
  onDelete: (section: AdminJlptSection) => void;
}) {
  const { register, handleSubmit, reset, watch, setValue } = useForm<AdminJlptSectionFormValues>({
    defaultValues: initialValues,
    mode: 'onBlur',
  });
  const form = watch();

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  return (
    <Modal title={editingJlptSectionId ? 'Edit JLPT Section' : 'Create JLPT Section'} subtitle={selectedJlptExam ? selectedJlptExam.title : 'Section settings'} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Title"><input className={inputClass} {...register('title', { required: true })} /></Field>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Field label="Section Type">
            <select
              className={inputClass}
              value={form.section_type}
              onChange={(e) => {
                const nextType = e.target.value as AdminSectionType;
                setValue('section_type', nextType);
                setValue('audio_asset_id', nextType === 'listening' ? form.audio_asset_id : null);
                setValue('audio_url', nextType === 'listening' ? form.audio_url : '');
              }}
            >
              {sectionTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>
          <Field label="Order"><input className={inputClass} type="number" min="1" {...register('section_order', { valueAsNumber: true })} /></Field>
          <Field label="Duration"><input className={inputClass} type="number" min="0" {...register('duration_minutes')} /></Field>
        </div>
        {form.section_type === 'listening' && (
          <AssetUploader
            label="Section Listening Audio"
            accept="audio/*"
            previewUrl={form.audio_url}
            mediaKind="audio"
            scope="jlpt-sections"
            fieldKey="jlpt-section-audio"
            uploadingField={uploadingField}
            onUpload={onUpload}
            onUploaded={(asset) => {
              setValue('audio_asset_id', asset.asset_id);
              setValue('audio_url', asset.secure_url);
            }}
          />
        )}
        {editingJlptSectionId && (
          <div className="rounded-lg border border-error/30 bg-error/5 p-4">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <p className="text-label-md font-semibold text-error">Hide Section</p>
                <p className="text-label-md text-on-surface-variant">This hides the section from learners and hides its question links.</p>
              </div>
              <button
                type="button"
                className={dangerButtonClass}
                disabled={busy}
                onClick={() => {
                  const section = sections.find((item) => item.section_id === editingJlptSectionId);
                  if (section) onDelete(section);
                }}
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </div>
        )}
        <ModalActions busy={busy} submitLabel={editingJlptSectionId ? 'Save Section' : 'Create Section'} onCancel={onClose} />
      </form>
    </Modal>
  );
}

