import type { Quiz, QuizSubmitResult } from '../../services/api';

export function QuizFocusResultBanner({
  quiz,
  result,
  timedOut,
  onRetake,
}: {
  quiz: Quiz;
  result: QuizSubmitResult;
  timedOut: boolean;
  onRetake: () => void;
}) {
  return (
    <section className={`rounded-xl border p-5 ${result.passed ? 'border-success/40 bg-success-container text-on-success-container' : 'border-error/40 bg-error-container text-on-error-container'}`}>
      <h2 className="text-headline-sm font-bold">
        {result.passed ? 'Passed' : 'Not passed'} - {result.score.toFixed(2)}%
      </h2>
      <p className="mt-1 text-body-md">
        {timedOut ? 'Time is up. Your current answers were submitted automatically. ' : ''}
        Passing score: {result.passing_score}%. {result.passed
          ? 'You can continue.'
          : quiz.has_passed
            ? 'This retake did not pass, but your previous passed attempt still satisfies the requirement.'
            : 'Review your answers and retake when ready.'}
      </p>
      {!result.passed && (
        <button type="button" onClick={onRetake} className="mt-4 rounded-lg bg-primary px-5 py-3 font-bold text-on-primary">
          Retake
        </button>
      )}
    </section>
  );
}
