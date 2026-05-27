interface QuestionOption {
  option_id: number;
  option_text: string;
}

export function QuestionOptionList({
  questionId,
  questionType,
  options,
  selectedOptionIds,
  result,
  disabled,
  labelClassName,
  showSelectedBadge,
  onSingleOption,
  onToggleMultipleOption,
}: {
  questionId: number;
  questionType: 'single_choice' | 'multiple_choice' | 'true_false' | 'fill_in_blank';
  options: QuestionOption[];
  selectedOptionIds: number[];
  result?: {
    selected_option_ids: number[];
    correct_option_ids: number[];
  } | null;
  disabled: boolean;
  labelClassName: (state: { checked: boolean; wasSelected: boolean; isCorrectOption: boolean }) => string;
  showSelectedBadge?: boolean;
  onSingleOption: (questionId: number, optionId: number) => void;
  onToggleMultipleOption: (questionId: number, optionId: number) => void;
}) {
  const isMultiple = questionType === 'multiple_choice';

  return (
    <div className="mt-4 space-y-2">
      {options.map((option) => {
        const checked = selectedOptionIds.includes(option.option_id);
        const isCorrectOption = Boolean(result?.correct_option_ids.includes(option.option_id));
        const wasSelected = Boolean(result?.selected_option_ids.includes(option.option_id) || checked);

        return (
          <label
            key={option.option_id}
            className={labelClassName({ checked, wasSelected, isCorrectOption })}
          >
            <input
              type={isMultiple ? 'checkbox' : 'radio'}
              name={`question-${questionId}`}
              checked={checked}
              disabled={disabled}
              onChange={() =>
                isMultiple
                  ? onToggleMultipleOption(questionId, option.option_id)
                  : onSingleOption(questionId, option.option_id)
              }
              className="mt-1"
            />
            <span className="flex-1 text-body-md">{option.option_text}</span>
            {result && showSelectedBadge && wasSelected && (
              <span className="rounded-full bg-surface/70 px-2 py-1 text-label-sm font-bold">
                Your answer
              </span>
            )}
            {result && isCorrectOption && (
              <span className="rounded-full bg-emerald-600 px-2 py-1 text-label-sm font-bold text-white">
                Correct
              </span>
            )}
          </label>
        );
      })}
    </div>
  );
}
