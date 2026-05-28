import { QuestionMediaBlock, QuestionOptionList, QuestionResultFeedback } from '../questions';
import type { JlptExamQuestion, JlptExamSubmitResult } from '../../services/api';
import type { AnswerState, JlptTestPhase } from './jlptTestUtils';

export function JlptQuestionCard({
  question,
  questionIndex,
  sectionRenderIndex,
  previousQuestion,
  answer,
  result,
  phase,
  onSingleOption,
  onToggleMultipleOption,
  onTextAnswer,
}: {
  question: JlptExamQuestion;
  questionIndex: number;
  sectionRenderIndex: number;
  previousQuestion?: JlptExamQuestion;
  answer: AnswerState[number];
  result: JlptExamSubmitResult | null;
  phase: JlptTestPhase;
  onSingleOption: (questionId: number, optionId: number) => void;
  onToggleMultipleOption: (questionId: number, optionId: number) => void;
  onTextAnswer: (questionId: number, answerText: string) => void;
}) {
  const questionResult = result?.question_results.find((item) => item.question_id === question.question_id);
  const shouldShowPassage = Boolean(
    question.reading_passage_id &&
    question.reading_passage_id !== previousQuestion?.reading_passage_id
  );

  return (
    <div className="space-y-3">
      {shouldShowPassage && (
        <section className="rounded-lg border border-primary/20 bg-primary-fixed/20 p-4">
          <p className="text-label-md font-bold uppercase text-primary">Reading Passage</p>
          {question.reading_passage_title && <h3 className="mt-1 text-title-md font-bold text-on-surface">{question.reading_passage_title}</h3>}
          {question.reading_passage_image_url && (
            <img src={question.reading_passage_image_url} alt={question.reading_passage_title || 'Reading passage'} className="mt-3 max-h-[520px] w-full rounded-lg border border-outline-variant object-contain" />
          )}
          {question.reading_passage_text && <p className="mt-3 whitespace-pre-line text-body-md leading-7 text-on-surface">{question.reading_passage_text}</p>}
        </section>
      )}
      <article className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
        <div className="flex gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">
            {phase === 'submitted' ? `${sectionRenderIndex + 1}.${questionIndex + 1}` : questionIndex + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-title-md font-bold text-on-surface">{question.question_text}</h3>
              <span className="rounded-full bg-surface-container px-2 py-1 text-label-sm text-on-surface-variant">
                {question.marks} mark{question.marks === 1 ? '' : 's'}
              </span>
            </div>

            <QuestionMediaBlock
              imageUrl={question.image_url}
              audioUrl={question.audio_url}
            />

            {question.question_type === 'fill_in_blank' ? (
              <input
                value={answer.answerText}
                onChange={(event) => onTextAnswer(question.question_id, event.target.value)}
                disabled={phase === 'submitted'}
                className="mt-4 w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 outline-none focus:border-primary"
                placeholder="Type your answer"
              />
            ) : (
              <QuestionOptionList
                questionId={question.question_id}
                questionType={question.question_type}
                options={question.options}
                selectedOptionIds={answer.optionIds}
                result={questionResult}
                disabled={phase === 'submitted'}
                labelClassName={({ checked, wasSelected, isCorrectOption }) => {
                  const optionClass = questionResult
                    ? isCorrectOption
                      ? 'border-success/40 bg-success-container text-on-success-container'
                      : wasSelected
                        ? 'border-error/40 bg-error-container text-on-error-container'
                        : 'border-outline-variant bg-surface opacity-75'
                    : checked
                      ? 'border-primary bg-primary-fixed/40'
                      : 'border-outline-variant bg-surface hover:border-primary';

                  return `flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition ${optionClass}`;
                }}
                onSingleOption={onSingleOption}
                onToggleMultipleOption={onToggleMultipleOption}
              />
            )}

            {questionResult && (
              <QuestionResultFeedback
                isCorrect={questionResult.is_correct}
                explanation={questionResult.explanation}
              />
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
