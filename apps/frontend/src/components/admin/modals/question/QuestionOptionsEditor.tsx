import type { UseFormSetValue } from 'react-hook-form';
import { dangerButtonClass, inputClass, secondaryButtonClass } from '../../adminClasses';
import type { AdminQuestionFormValues } from '../../adminFormTypes';

export function QuestionOptionsEditor({
  form,
  setValue,
}: {
  form: AdminQuestionFormValues;
  setValue: UseFormSetValue<AdminQuestionFormValues>;
}) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-title-md font-semibold text-on-surface">Options</h3>
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={() => setValue('options', [...form.options, { option_id: undefined, option_text: '', is_correct: false, explanation: '' }])}
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Option
        </button>
      </div>
      <div className="space-y-3">
        {form.options.map((option, index) => (
          <div key={index} className="grid grid-cols-1 gap-2 rounded border border-outline-variant bg-surface p-3 md:grid-cols-[1fr_auto_auto] md:items-start">
            <input
              className={inputClass}
              placeholder={form.question_type === 'fill_in_blank' ? 'Accepted answer' : `Option ${index + 1}`}
              value={option.option_text}
              onChange={(event) => {
                const next = [...form.options];
                next[index] = { ...option, option_text: event.target.value };
                setValue('options', next);
              }}
            />
            <label className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-3 py-2 text-label-md text-on-surface">
              <input
                type="checkbox"
                checked={option.is_correct}
                onChange={(event) => {
                  const next = form.options.map((item, itemIndex) => ({
                    ...item,
                    is_correct:
                      form.question_type === 'multiple_choice'
                        ? itemIndex === index
                          ? event.target.checked
                          : item.is_correct
                        : itemIndex === index
                          ? event.target.checked
                          : false,
                  }));
                  setValue('options', next);
                }}
              />
              Correct
            </label>
            <button
              type="button"
              className={dangerButtonClass}
              disabled={form.options.length <= 1}
              onClick={() => setValue('options', form.options.filter((_, itemIndex) => itemIndex !== index))}
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
