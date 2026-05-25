import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { AdminCloudinaryAsset, AdminCourse } from '../../../services/api';
import { dangerButtonClass, inputClass, secondaryButtonClass } from '../adminClasses';
import type { AdminCourseFormValues } from '../adminFormTypes';
import { courseLevelOptions } from '../adminOptions';
import { AssetUploader, Field, Modal, ModalActions } from '../DashboardUi';

export function CourseFormModal({
  editingCourseId,
  selectedCourse,
  busy,
  initialValues,
  uploadingField,
  onUpload,
  onSubmit,
  onClose,
  onManageLessons,
  onDelete,
}: {
  editingCourseId: number | null;
  selectedCourse: AdminCourse | null;
  busy: boolean;
  initialValues: AdminCourseFormValues;
  uploadingField: string | null;
  onUpload: (file: File, mediaKind: 'image' | 'video' | 'audio', scope: string, fieldKey: string) => Promise<AdminCloudinaryAsset>;
  onSubmit: (values: AdminCourseFormValues) => void;
  onClose: () => void;
  onManageLessons: (courseId: number) => void;
  onDelete: (course: AdminCourse) => void;
}) {
  const { register, handleSubmit, reset, watch, setValue } = useForm<AdminCourseFormValues>({
    defaultValues: initialValues,
    mode: 'onBlur',
  });
  const form = watch();

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  return (
    <Modal title={editingCourseId ? 'Edit Course' : 'Create Course'} subtitle="Course metadata is owned by the course creator." onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Title"><input className={inputClass} {...register('title', { required: true })} /></Field>
        <Field label="Description"><textarea className={inputClass} rows={4} {...register('description')} /></Field>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Field label="Price"><input className={inputClass} type="number" min="0" {...register('price', { valueAsNumber: true })} /></Field>
          <Field label="Level">
            <select className={inputClass} {...register('level')}>
              {courseLevelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Duration"><input className={inputClass} type="number" {...register('duration')} /></Field>
        </div>
        <AssetUploader
          label="Course Cover Image"
          accept="image/*"
          previewUrl={form.image_url}
          mediaKind="image"
          scope="courses"
          fieldKey="course-cover"
          uploadingField={uploadingField}
          onUpload={onUpload}
          onUploaded={(asset) => {
            setValue('cover_asset_id', asset.asset_id);
            setValue('image_url', asset.secure_url);
          }}
        />
        <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <p className="text-label-md font-semibold text-on-surface">Lessons</p>
              <p className="text-label-md text-on-surface-variant">
                {editingCourseId ? 'Open lesson management for this course.' : 'Create the course before managing lessons.'}
              </p>
            </div>
            <button
              type="button"
              className={secondaryButtonClass}
              disabled={!editingCourseId}
              onClick={() => editingCourseId && onManageLessons(editingCourseId)}
            >
              <span className="material-symbols-outlined text-[18px]">menu_book</span>
              Manage Lessons
            </button>
          </div>
        </div>
        {editingCourseId && selectedCourse && (
          <div className="rounded-lg border border-error/30 bg-error/5 p-4">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <p className="text-label-md font-semibold text-error">Hide Course</p>
                <p className="text-label-md text-on-surface-variant">This hides the course, its lessons, and related quizzes. Learner enrollments, purchases, ratings, attempts, and answers are kept.</p>
              </div>
              <button type="button" className={dangerButtonClass} disabled={busy} onClick={() => onDelete(selectedCourse)}>
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </div>
        )}
        <ModalActions busy={busy} submitLabel={editingCourseId ? 'Save Changes' : 'Create Course'} onCancel={onClose} />
      </form>
    </Modal>
  );
}
