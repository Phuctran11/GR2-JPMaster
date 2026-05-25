import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { AdminJlptExam } from '../../../services/api';
import { dangerButtonClass, inputClass, secondaryButtonClass } from '../adminClasses';
import type { AdminJlptExamFormValues } from '../adminFormTypes';
import { jlptLevelOptions, sectionTypeOptions } from '../adminOptions';
import { Field, Modal, ModalActions } from '../DashboardUi';

export function JlptExamFormModal({
  editingJlptExamId,
  selectedJlptExam,
  busy,
  initialValues,
  onSubmit,
  onClose,
  onManageSections,
  onDelete,
}: {
  editingJlptExamId: number | null;
  selectedJlptExam: AdminJlptExam | null;
  busy: boolean;
  initialValues: AdminJlptExamFormValues;
  onSubmit: (values: AdminJlptExamFormValues) => void;
  onClose: () => void;
  onManageSections: (examId: number) => void;
  onDelete: (exam: AdminJlptExam) => void;
}) {
  const { register, handleSubmit, reset, watch, setValue } = useForm<AdminJlptExamFormValues>({
    defaultValues: initialValues,
    mode: 'onBlur',
  });
  const form = watch();

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  return (
    <Modal title={editingJlptExamId ? 'Edit JLPT Test' : 'Create JLPT Test'} subtitle="JLPT tests are managed separately from course quizzes." onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Title"><input className={inputClass} {...register('title', { required: true })} /></Field>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Field label="JLPT Level">
            <select className={inputClass} {...register('jlpt_level')}>
              {jlptLevelOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Year"><input className={inputClass} type="number" min="1984" {...register('year')} /></Field>
          <Field label="Duration"><input className={inputClass} type="number" min="0" {...register('duration_minutes')} /></Field>
        </div>
        {!editingJlptExamId && (
          <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
            <p className="mb-3 text-label-md font-semibold text-on-surface">Sections</p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
              {sectionTypeOptions.map((option) => (
                <label key={option.value} className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-label-md text-on-surface">
                  <input
                    type="checkbox"
                    checked={form.sections.includes(option.value)}
                    onChange={(e) => {
                      const nextSections = e.target.checked ? [...form.sections, option.value] : form.sections.filter((section) => section !== option.value);
                      setValue('sections', sectionTypeOptions.map((item) => item.value).filter((section) => nextSections.includes(section)));
                    }}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
        )}
        {editingJlptExamId && selectedJlptExam && (
          <div className="space-y-3">
            <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                  <p className="text-label-md font-semibold text-on-surface">Sections and Questions</p>
                  <p className="text-label-md text-on-surface-variant">{selectedJlptExam.section_count || 0} sections, {selectedJlptExam.question_count || 0} questions</p>
                </div>
                <button type="button" className={secondaryButtonClass} onClick={() => onManageSections(selectedJlptExam.exam_id)}>
                  <span className="material-symbols-outlined text-[18px]">view_list</span>
                  Manage Sections
                </button>
              </div>
            </div>
            <div className="rounded-lg border border-error/30 bg-error/5 p-4">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                  <p className="text-label-md font-semibold text-error">Hide JLPT Test</p>
                  <p className="text-label-md text-on-surface-variant">This hides the test and its section links without removing question records.</p>
                </div>
                <button type="button" className={dangerButtonClass} disabled={busy} onClick={() => onDelete(selectedJlptExam)}>
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          </div>
        )}
        <ModalActions busy={busy} submitLabel={editingJlptExamId ? 'Save Changes' : 'Create JLPT Test'} onCancel={onClose} />
      </form>
    </Modal>
  );
}

