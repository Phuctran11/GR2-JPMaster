import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { AdminCloudinaryAsset } from '../../../services/api';
import { inputClass } from '../adminClasses';
import type { AdminBlogFormValues } from '../adminFormTypes';
import { AssetUploader, Field, Modal, ModalActions } from '../DashboardUi';

export function BlogFormModal({
  editingBlogId,
  busy,
  initialValues,
  uploadingField,
  onUpload,
  onSubmit,
  onClose,
}: {
  editingBlogId: number | null;
  busy: boolean;
  initialValues: AdminBlogFormValues;
  uploadingField: string | null;
  onUpload: (file: File, mediaKind: 'image' | 'video' | 'audio', scope: string, fieldKey: string) => Promise<AdminCloudinaryAsset>;
  onSubmit: (values: AdminBlogFormValues) => void;
  onClose: () => void;
}) {
  const { register, handleSubmit, reset, watch, setValue } = useForm<AdminBlogFormValues>({
    defaultValues: initialValues,
    mode: 'onBlur',
  });
  const form = watch();

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  return (
    <Modal title={editingBlogId ? 'Edit Blog' : 'Create Blog'} subtitle="Manage article metadata, content, and publication status." onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Title"><input className={inputClass} {...register('title', { required: true })} /></Field>
        <Field label="Slug"><input className={inputClass} {...register('slug')} /></Field>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Category"><input className={inputClass} {...register('category')} /></Field>
          <Field label="Status">
            <select className={inputClass} {...register('status')}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
        </div>
        <Field label="Tags"><input className={inputClass} placeholder="grammar, N5, vocabulary" {...register('tags')} /></Field>
        <Field label="Excerpt"><textarea className={inputClass} rows={3} {...register('excerpt')} /></Field>
        <Field label="Content"><textarea className={inputClass} rows={7} {...register('content')} /></Field>
        <AssetUploader
          label="Blog Cover Image"
          accept="image/*"
          previewUrl={form.image_url}
          mediaKind="image"
          scope="blog"
          fieldKey="blog-cover"
          uploadingField={uploadingField}
          onUpload={onUpload}
          onUploaded={(asset) => {
            setValue('cover_asset_id', asset.asset_id);
            setValue('image_url', asset.secure_url);
          }}
        />
        <AssetUploader
          label="Blog Video"
          accept="video/*"
          previewUrl={form.video_url}
          mediaKind="video"
          scope="blog"
          fieldKey="blog-video"
          uploadingField={uploadingField}
          onUpload={onUpload}
          onUploaded={(asset) => {
            setValue('video_asset_id', asset.asset_id);
            setValue('video_url', asset.secure_url);
          }}
        />
        <ModalActions busy={busy} submitLabel={editingBlogId ? 'Save Changes' : 'Create Blog'} onCancel={onClose} />
      </form>
    </Modal>
  );
}
