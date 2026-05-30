import { QuestionMediaBlock, QuestionOptionList, QuestionResultFeedback } from '../questions';
import type { QuizQuestion, QuizSubmitResult } from '../../services/api';
import { QuestionStemHeader } from './QuestionStemHeader';
import type { QuizAnswerState } from './quizPanelUtils';

export function QuizQuestionItem({
  question,
  index,
  answer,
  submitResult,
  isSubmitted,
  onSingleOption,
  onToggleMultipleOption,
  onTextAnswer,
}: {
  question: QuizQuestion;
  index: number;
  answer: QuizAnswerState[number];
  submitResult: QuizSubmitResult | null;
  isSubmitted: boolean;
  onSingleOption: (questionId: number, optionId: number) => void;
  onToggleMultipleOption: (questionId: number, optionId: number) => void;
  onTextAnswer: (questionId: number, answerText: string) => void;
}) {
  const result = submitResult?.question_results.find((item) => item.question_id === question.question_id);

  return (
    <article className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
      <div className="flex gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <QuestionStemHeader questionText={question.question_text} marks={question.marks} />
          <QuestionMediaBlock
            imageUrl={question.image_url}
            audioUrl={question.audio_url}
            audioFallback="Your browser does not support audio playback."
          />

          {question.question_type === 'fill_in_blank' ? (
            <input
              value={answer.answerText}
              onChange={(event) => onTextAnswer(question.question_id, event.target.value)}
              disabled={isSubmitted}
              className="mt-4 w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 outline-none focus:border-primary"
              placeholder="Type your answer"
            />
          ) : (
            <QuestionOptionList
              questionId={question.question_id}
              questionType={question.question_type}
              options={question.options}
              selectedOptionIds={answer.optionIds}
              result={result}
              disabled={isSubmitted}
              showSelectedBadge
              labelClassName={({ checked, wasSelected, isCorrectOption }) => {
                const optionStateClass = result
                  ? isCorrectOption
                    ? 'border-success/40 bg-success-container text-on-success-container'
                    : wasSelected
                      ? 'border-error/40 bg-error-container text-on-error-container'
                      : 'border-outline-variant bg-surface opacity-75'
                  : checked
                    ? 'border-primary bg-primary-fixed/40'
                    : 'border-outline-variant bg-surface hover:border-primary';

                return `flex items-start gap-3 rounded-lg border px-4 py-3 transition ${isSubmitted ? 'cursor-default' : 'cursor-pointer'} ${optionStateClass}`;
              }}
              onSingleOption={onSingleOption}
              onToggleMultipleOption={onToggleMultipleOption}
            />
          )}

          {result && (
            <QuestionResultFeedback
              isCorrect={result.is_correct}
              explanation={result.explanation}
            />
          )}

        </div>
      </div>
    </article>
  );
}
