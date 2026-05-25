import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { AdminJlptExam, AdminJlptSection } from '../../../services/api';
import { inputClass } from '../adminClasses';
import type { AdminAutoJlptQuestionsFormValues } from '../adminFormTypes';
import { optionLabel } from '../adminHelpers';
import { jlptLevelOptions, sectionTypeOptions } from '../adminOptions';
import { Field, Modal, ModalActions } from '../DashboardUi';

export function AutoJlptQuestionsModal({
  section,
  selectedJlptExam,
  busy,
  initialValues,
  onSubmit,
  onClose,
}: {
  section: AdminJlptSection | null;
  selectedJlptExam: AdminJlptExam | null;
  busy: boolean;
  initialValues: AdminAutoJlptQuestionsFormValues;
  onSubmit: (values: AdminAutoJlptQuestionsFormValues) => void;
  onClose: () => void;
}) {
  const { register, handleSubmit, reset } = useForm<AdminAutoJlptQuestionsFormValues>({
    defaultValues: initialValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  return (
    <Modal title="Auto Add Questions" subtitle={section ? `${optionLabel(sectionTypeOptions, section.section_type)} - ${selectedJlptExam?.title || 'JLPT test'}` : 'JLPT section'} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="JLPT Level">
          <select className={inputClass} {...register('jlpt_level')}>
            {jlptLevelOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {['easy', 'medium', 'hard', 'expert'].map((difficulty) => {
            const key = difficulty as 'easy' | 'medium' | 'hard' | 'expert';
            return (
              <Field key={difficulty} label={difficulty}>
                <input className={inputClass} type="number" min="0" {...register(key, { valueAsNumber: true })} />
              </Field>
            );
          })}
        </div>
        <ModalActions busy={busy} submitLabel="Auto Add Questions" onCancel={onClose} />
      </form>
    </Modal>
  );
}

