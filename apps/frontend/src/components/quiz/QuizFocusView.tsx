import { Container } from '../ui';
import { QuizPanel } from '../lesson';
import type { useQuizFocusController } from '../../hooks/quiz/useQuizFocusController';
import { QuizFocusHeader } from './QuizFocusHeader';
import { QuizFocusResultBanner } from './QuizFocusResultBanner';

type QuizFocusController = ReturnType<typeof useQuizFocusController>;

export function QuizFocusView({
  controller,
  lessonId,
}: {
  controller: QuizFocusController;
  lessonId?: string;
}) {
  const {
    isFinalTest,
    quiz,
    attempt,
    courseTitle,
    remainingSeconds,
    submitSignal,
    submittedResult,
    timedOut,
    handleSubmitted,
    handleRetake,
    handleExit,
  } = controller;

  if (!quiz) return null;

  return (
    <main className="fixed inset-0 z-[70] overflow-y-auto bg-surface-container-low">
      <QuizFocusHeader
        quiz={quiz}
        courseTitle={courseTitle}
        isFinalTest={isFinalTest}
        remainingSeconds={remainingSeconds}
        submittedResult={submittedResult}
        onExit={handleExit}
      />

      <Container className="py-6 md:py-8">
        <div className="mx-auto max-w-4xl space-y-5">
          {!submittedResult && (
            <section className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
              Focus mode is locked. Submit this {isFinalTest ? 'final test' : 'quiz'} to exit.
            </section>
          )}

          {!submittedResult && timedOut && (
            <section className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-800">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined mt-0.5">timer_off</span>
                <div>
                  <h2 className="text-title-md font-bold">Time is up</h2>
                  <p className="mt-1 text-body-md">
                    Your current answers are being submitted automatically. Please wait for the result.
                  </p>
                </div>
              </div>
            </section>
          )}

          {submittedResult && (
            <QuizFocusResultBanner
              quiz={quiz}
              result={submittedResult}
              timedOut={timedOut}
              onRetake={handleRetake}
            />
          )}

          <QuizPanel
            key={attempt?.attempt_id ?? quiz.quiz_id}
            quiz={quiz}
            attemptId={attempt?.attempt_id}
            titlePrefix={isFinalTest ? 'Final test' : 'Lesson quiz'}
            lockedMessage={isFinalTest ? 'Pass this test to complete the course and unlock certification.' : 'Pass this quiz before marking the lesson complete.'}
            allowIncompleteSubmit
            submitSignal={submitSignal}
            onSubmitted={handleSubmitted}
            onRetake={handleRetake}
            lessonId={lessonId ? parseInt(lessonId) : quiz.lesson_id ?? undefined}
          />
        </div>
      </Container>
    </main>
  );
}
