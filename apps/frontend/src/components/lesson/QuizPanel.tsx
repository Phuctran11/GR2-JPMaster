import type { Quiz, QuizSubmitResult } from '../../services/api';
import { useQuizPanelController } from '../../hooks/lesson/useQuizPanelController';
import { emptyQuizAnswer } from './quizPanelUtils';
import { QuizLatestAttemptBanner } from './QuizLatestAttemptBanner';
import { QuizPanelFooter } from './QuizPanelFooter';
import { QuizPanelHeader } from './QuizPanelHeader';
import { QuizQuestionItem } from './QuizQuestionItem';
import { QuizSubmitConfirmDialog } from './QuizSubmitConfirmDialog';

interface QuizPanelProps {
  quiz: Quiz;
  attemptId?: number;
  titlePrefix?: string;
  lockedMessage?: string;
  allowIncompleteSubmit?: boolean;
  submitSignal?: number;
  onPassed?: (result: QuizSubmitResult) => void;
  onSubmitted?: (result: QuizSubmitResult) => void;
  onRetake?: () => void;
  lessonId?: number;
}

export function QuizPanel({
  quiz,
  attemptId,
  titlePrefix = 'Quiz',
  lockedMessage,
  allowIncompleteSubmit = false,
  submitSignal = 0,
  onPassed,
  onSubmitted,
  onRetake,
  lessonId,
}: QuizPanelProps) {
  const {
    answers,
    submitting,
    submitResult,
    error,
    showSubmitConfirm,
    setShowSubmitConfirm,
    questionNotes,
    latestAttempt,
    requirementSatisfied,
    answeredCount,
    allAnswered,
    isSubmitted,
    unansweredCount,
    setSingleOption,
    toggleMultipleOption,
    setTextAnswer,
    performSubmit,
    handleSubmitRequest,
    handleQuestionNoteSaved,
    handleQuestionNoteDeleted,
  } = useQuizPanelController({
    quiz,
    attemptId,
    allowIncompleteSubmit,
    submitSignal,
    onPassed,
    onSubmitted,
  });
  const quizLabel = titlePrefix.toLowerCase().includes('final') ? 'final test' : 'quiz';

  return (
    <section className="rounded-xl border border-outline-variant bg-surface p-5 shadow-sm">
      <QuizPanelHeader
        quiz={quiz}
        titlePrefix={titlePrefix}
        lockedMessage={lockedMessage}
      />
      <QuizLatestAttemptBanner
        latestAttempt={latestAttempt}
        requirementSatisfied={requirementSatisfied}
      />

      <div className="mt-5 space-y-4">
        {quiz.questions.map((question, index) => (
          <QuizQuestionItem
            key={question.question_id}
            quiz={quiz}
            question={question}
            index={index}
            answer={answers[question.question_id] ?? emptyQuizAnswer}
            submitResult={submitResult}
            isSubmitted={isSubmitted}
            existingQuestionNote={questionNotes.find((note) => note.question_id === question.question_id) ?? null}
            lessonId={lessonId}
            onSingleOption={setSingleOption}
            onToggleMultipleOption={toggleMultipleOption}
            onTextAnswer={setTextAnswer}
            onQuestionNoteSaved={handleQuestionNoteSaved}
            onQuestionNoteDeleted={handleQuestionNoteDeleted}
          />
        ))}
      </div>

      {error && <p className="mt-4 rounded-lg bg-error-container px-4 py-3 text-on-error-container">{error}</p>}

      {showSubmitConfirm && (
        <QuizSubmitConfirmDialog
          quizLabel={quizLabel}
          answeredCount={answeredCount}
          questionCount={quiz.questions.length}
          unansweredCount={unansweredCount}
          submitting={submitting}
          onCancel={() => setShowSubmitConfirm(false)}
          onConfirm={() => void performSubmit()}
        />
      )}

      <QuizPanelFooter
        answeredCount={answeredCount}
        questionCount={quiz.questions.length}
        isSubmitted={isSubmitted}
        canRetake={Boolean(onRetake)}
        allAnswered={allAnswered}
        allowIncompleteSubmit={allowIncompleteSubmit}
        submitting={submitting}
        onRetake={onRetake}
        onSubmitRequest={handleSubmitRequest}
      />
    </section>
  );
}
