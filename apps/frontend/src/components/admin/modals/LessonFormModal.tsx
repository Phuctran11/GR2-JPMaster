import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { AdminCloudinaryAsset, AdminCourse, AdminLesson, AdminTest } from '../../../services/api';
import { actionButtonClass, inputClass, secondaryButtonClass } from '../adminClasses';
import type { AdminLessonFormValues } from '../adminFormTypes';
import { optionLabel } from '../adminHelpers';
import { courseLevelOptions } from '../adminOptions';
import { AssetUploader, Field, Modal, ModalActions } from '../DashboardUi';

export function LessonFormModal({
  editingLessonId,
  selectedCourse,
  courses,
  courseLessons,
  currentLessonQuiz,
  busy,
  initialValues,
  uploadingField,
  onUpload,
  onSubmit,
  onClose,
  onCourseChange,
  onCreateLessonQuiz,
  onEditLessonQuiz,
}: {
  editingLessonId: number | null;
  selectedCourse: AdminCourse | null;
  courses: AdminCourse[];
  courseLessons: AdminLesson[];
  currentLessonQuiz: AdminTest | null;
  busy: boolean;
  initialValues: AdminLessonFormValues;
  uploadingField: string | null;
  onUpload: (file: File, mediaKind: 'image' | 'video' | 'audio', scope: string, fieldKey: string) => Promise<AdminCloudinaryAsset>;
  onSubmit: (values: AdminLessonFormValues) => void;
  onClose: () => void;
  onCourseChange: (courseId: number | null) => void;
  onCreateLessonQuiz: () => void;
  onEditLessonQuiz: (quiz: AdminTest) => void;
}) {
  const { register, handleSubmit, reset, watch, setValue } = useForm<AdminLessonFormValues>({
    defaultValues: initialValues,
    mode: 'onBlur',
  });
  const form = watch();

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  return (
    <Modal
      title={editingLessonId ? 'Edit Lesson' : 'Create Lesson'}
      subtitle={selectedCourse ? `Course: ${selectedCourse.title}` : 'Attach this lesson to a course.'}
      onClose={onClose}
      size="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
              <div className="mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">article</span>
                <h3 className="text-title-md font-semibold text-on-surface">Lesson Details</h3>
              </div>
              <div className="space-y-4">
                <Field label="Course">
                  <select
                    className={inputClass}
                    required
                    value={form.course_id}
                    onChange={(e) => {
                      setValue('course_id', e.target.value);
                      const courseId = e.target.value ? Number(e.target.value) : null;
                      onCourseChange(Number.isFinite(courseId) ? courseId : null);
                    }}
                  >
                    <option value="">Select course</option>
                    {courses.map((course) => <option key={course.course_id} value={course.course_id}>{course.title}</option>)}
                  </select>
                </Field>
                <Field label="Title"><input className={inputClass} {...register('title', { required: true })} /></Field>
                <Field label="Content"><textarea className={inputClass} rows={8} {...register('content_text')} /></Field>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <AssetUploader
                label="Lesson Video"
                accept="video/*"
                previewUrl={form.video_url}
                mediaKind="video"
                scope="lessons"
                fieldKey="lesson-video"
                uploadingField={uploadingField}
                onUpload={onUpload}
                onUploaded={(asset) => {
                  setValue('video_asset_id', asset.asset_id);
                  setValue('video_url', asset.secure_url);
                }}
              />
              <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
                <div className="mb-3 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[20px] text-primary">link</span>
                  <div>
                    <p className="text-label-md font-semibold text-on-surface">External Video Link</p>
                    <p className="text-label-md text-on-surface-variant">Paste a YouTube, youtu.be, embed, or direct video URL.</p>
                  </div>
                </div>
                <input
                  className={inputClass}
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={form.video_url}
                  onChange={(e) => {
                    setValue('video_asset_id', null);
                    setValue('video_url', e.target.value);
                  }}
                />
              </div>
              <AssetUploader
                label="Lesson Narration Audio"
                accept="audio/*"
                previewUrl={form.audio_url}
                mediaKind="audio"
                scope="lessons"
                fieldKey="lesson-audio"
                uploadingField={uploadingField}
                onUpload={onUpload}
                onUploaded={(asset) => {
                  setValue('audio_asset_id', asset.asset_id);
                  setValue('audio_url', asset.secure_url);
                }}
              />
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
              <div className="mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">tune</span>
                <h3 className="text-title-md font-semibold text-on-surface">Settings</h3>
              </div>
              <div className="space-y-4">
                <Field label="Order"><input className={inputClass} type="number" min="1" {...register('order_index', { valueAsNumber: true })} /></Field>
                <Field label="Duration"><input className={inputClass} type="number" min="0" {...register('duration')} /></Field>
              </div>
            </div>
            <div className="rounded-lg border border-outline-variant bg-surface p-4 text-label-md text-on-surface-variant">
              <p className="mb-2 font-semibold text-on-surface">Current Course</p>
              <p>{selectedCourse?.title || 'No course selected'}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <span className="rounded bg-surface-container-low px-2 py-1">Lessons: {courseLessons.length}</span>
                <span className="rounded bg-surface-container-low px-2 py-1">Level: {optionLabel(courseLevelOptions, selectedCourse?.level)}</span>
              </div>
            </div>
            <div className="rounded-lg border border-outline-variant bg-surface p-4">
              <div className="mb-3 flex items-start gap-2">
                <span className="material-symbols-outlined text-primary">quiz</span>
                <div>
                  <h3 className="text-title-md font-semibold text-on-surface">Lesson Quiz</h3>
                  <p className="text-label-md text-on-surface-variant">
                    {editingLessonId
                      ? currentLessonQuiz
                        ? `${currentLessonQuiz.question_count || 0} questions`
                        : 'No quiz attached'
                      : 'Save the lesson before creating a quiz'}
                  </p>
                </div>
              </div>
              {currentLessonQuiz && (
                <div className="mb-3 rounded bg-surface-container-low p-3 text-label-md text-on-surface-variant">
                  <p className="font-semibold text-on-surface">{currentLessonQuiz.title}</p>
                  <p>Passing score: {currentLessonQuiz.passing_score}</p>
                  <p>Total marks: {currentLessonQuiz.total_marks}</p>
                </div>
              )}
              <button
                type="button"
                className={currentLessonQuiz ? secondaryButtonClass : actionButtonClass}
                disabled={!editingLessonId}
                onClick={() => (currentLessonQuiz ? onEditLessonQuiz(currentLessonQuiz) : onCreateLessonQuiz())}
              >
                <span className="material-symbols-outlined text-[18px]">{currentLessonQuiz ? 'edit' : 'add'}</span>
                {currentLessonQuiz ? 'Edit Quiz' : 'Create Quiz'}
              </button>
            </div>
          </aside>
        </div>
        <ModalActions busy={busy} submitLabel={editingLessonId ? 'Save Changes' : 'Create Lesson'} onCancel={onClose} />
      </form>
    </Modal>
  );
}

