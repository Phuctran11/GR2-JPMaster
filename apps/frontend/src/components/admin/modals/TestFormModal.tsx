import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { AdminCourse, AdminLesson, AdminTest } from '../../../services/api';
import { dangerButtonClass, inputClass, secondaryButtonClass } from '../adminClasses';
import type { AdminTestFormValues } from '../adminFormTypes';
import { quizTypeOptions } from '../adminOptions';
import { Field, Modal, ModalActions } from '../DashboardUi';

export function TestFormModal({
  editingTestId,
  returnModalAfterTest,
  courses,
  lessons,
  tests,
  lessonQuizzes,
  busy,
  initialValues,
  onSubmit,
  onClose,
  onManageQuestions,
  onDelete,
}: {
  editingTestId: number | null;
  returnModalAfterTest: string | null;
  courses: AdminCourse[];
  lessons: AdminLesson[];
  tests: AdminTest[];
  lessonQuizzes: AdminTest[];
  busy: boolean;
  initialValues: AdminTestFormValues;
  onSubmit: (values: AdminTestFormValues) => void;
  onClose: () => void;
  onManageQuestions: (quizId: number) => void;
  onDelete: (item: AdminTest) => void;
}) {
  const { register, handleSubmit, reset, watch, setValue } = useForm<AdminTestFormValues>({
    defaultValues: initialValues,
    mode: 'onBlur',
  });
  const form = watch();

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  return (
    <Modal
      title={editingTestId ? 'Edit Test' : 'Create Test'}
      subtitle={returnModalAfterTest === 'lesson' ? 'This quiz is attached to the current lesson.' : 'Configure test metadata and scoring settings.'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Title"><input className={inputClass} {...register('title', { required: true })} /></Field>
        <Field label="Description"><textarea className={inputClass} rows={3} {...register('description')} /></Field>
        <Field label="Type">
          <select
            className={inputClass}
            {...register('quiz_type')}
          >
            {quizTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Course">
            <select
              className={inputClass}
              value={form.course_id}
              onChange={(e) => {
                setValue('course_id', e.target.value);
                setValue('lesson_id', '');
              }}
            >
              <option value="">No course</option>
              {courses.map((course) => (
                <option key={course.course_id} value={course.course_id}>
                  {course.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Lesson">
            <select className={inputClass} {...register('lesson_id')}>
              <option value="">No lesson</option>
              {lessons
                .filter((lesson) => !form.course_id || String(lesson.course_id) === String(form.course_id))
                .map((lesson) => (
                  <option key={lesson.lesson_id} value={lesson.lesson_id}>
                    {lesson.title}
                  </option>
                ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Field label="Passing Score"><input className={inputClass} type="number" {...register('passing_score', { valueAsNumber: true })} /></Field>
          <Field label="Total Marks"><input className={inputClass} type="number" {...register('total_marks', { valueAsNumber: true })} /></Field>
          <Field label="Time Limit"><input className={inputClass} type="number" {...register('time_limit_minutes')} /></Field>
        </div>
        {editingTestId && (
          <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <p className="text-label-md font-semibold text-on-surface">Questions</p>
                <p className="text-label-md text-on-surface-variant">Create and edit questions for this quiz.</p>
              </div>
              <button type="button" className={secondaryButtonClass} onClick={() => onManageQuestions(editingTestId)}>
                <span className="material-symbols-outlined text-[18px]">quiz</span>
                Manage Questions
              </button>
            </div>
          </div>
        )}
        {editingTestId && (
          <div className="rounded-lg border border-error/30 bg-error/5 p-4">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <p className="text-label-md font-semibold text-error">Hide Test</p>
                <p className="text-label-md text-on-surface-variant">This hides the quiz/test from learners and admin lists. Learner attempts and answers are kept.</p>
              </div>
              <button
                type="button"
                className={dangerButtonClass}
                disabled={busy}
                onClick={() => {
                  const currentTest = tests.find((test) => test.quiz_id === editingTestId) ?? lessonQuizzes.find((test) => test.quiz_id === editingTestId);
                  if (currentTest) onDelete(currentTest);
                }}
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </div>
        )}
        <ModalActions busy={busy} submitLabel={editingTestId ? 'Save Changes' : 'Create Test'} onCancel={onClose} />
      </form>
    </Modal>
  );
}

