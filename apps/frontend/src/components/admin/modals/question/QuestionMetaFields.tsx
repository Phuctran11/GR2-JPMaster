import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import type { AdminQuizQuestion, AdminReadingPassage, AdminSectionType } from '../../../../services/api';
import { inputClass } from '../../adminClasses';
import type { AdminQuestionFormValues } from '../../adminFormTypes';
import { jlptLevelOptions, questionTypeOptions, sectionTypeOptions } from '../../adminOptions';
import { Field } from '../../DashboardUi';

export function QuestionMetaFields({
  form,
  managingJlptSectionId,
  readingPassages,
  register,
  setValue,
}: {
  form: AdminQuestionFormValues;
  managingJlptSectionId: number | null;
  readingPassages: AdminReadingPassage[];
  register: UseFormRegister<AdminQuestionFormValues>;
  setValue: UseFormSetValue<AdminQuestionFormValues>;
}) {
  return (
    <aside className="space-y-4 rounded-lg border border-outline-variant bg-surface-container-low p-4">
      <Field label="Type">
        <select
          className={inputClass}
          value={form.question_type}
          onChange={(event) => {
            const nextType = event.target.value as AdminQuizQuestion['question_type'];
            const nextOptions = nextType === 'true_false'
              ? [
                  { option_id: undefined, option_text: 'True', is_correct: true, explanation: '' },
                  { option_id: undefined, option_text: 'False', is_correct: false, explanation: '' },
                ]
              : form.options;
            setValue('question_type', nextType);
            setValue('options', nextOptions);
          }}
        >
          {questionTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Order"><input className={inputClass} type="number" min="1" {...register('order_index')} /></Field>
        <Field label="Marks"><input className={inputClass} type="number" min="0" step="0.5" {...register('marks', { valueAsNumber: true })} /></Field>
      </div>
      <Field label="Points"><input className={inputClass} type="number" min="0" step="0.5" {...register('points', { valueAsNumber: true })} /></Field>
      <Field label="Difficulty">
        <select className={inputClass} {...register('difficulty_level')}>
          {['easy', 'medium', 'hard', 'expert'].map((difficulty) => (
            <option key={difficulty} value={difficulty}>
              {difficulty}
            </option>
          ))}
        </select>
      </Field>
      <Field label="JLPT Level">
        <select className={inputClass} {...register('jlpt_level')}>
          {jlptLevelOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Section">
        <select
          className={inputClass}
          disabled={Boolean(managingJlptSectionId)}
          value={form.section_type}
          onChange={(event) => {
            const nextSection = event.target.value as AdminSectionType;
            setValue('section_type', nextSection);
            setValue('audio_asset_id', nextSection === 'listening' ? form.audio_asset_id : null);
            setValue('audio_url', nextSection === 'listening' ? form.audio_url : '');
          }}
        >
          {sectionTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>
      {form.section_type === 'reading' && (
        <Field label="Reading Passage">
          <select
            className={inputClass}
            required
            {...register('reading_passage_id', { required: true })}
          >
            <option value="">Select passage</option>
            {readingPassages.map((passage) => (
              <option key={passage.passage_id} value={passage.passage_id}>
                {passage.title || `Passage #${passage.passage_id}`}
              </option>
            ))}
          </select>
        </Field>
      )}
    </aside>
  );
}
