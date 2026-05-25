export function QuizSubmitConfirmDialog({
  quizLabel,
  answeredCount,
  questionCount,
  unansweredCount,
  submitting,
  onCancel,
  onConfirm,
}: {
  quizLabel: string;
  answeredCount: number;
  questionCount: number;
  unansweredCount: number;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="submit-confirm-title">
      <section className="w-full max-w-md rounded-xl border border-outline-variant bg-white p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-on-primary-fixed">
            <span className="material-symbols-outlined text-[28px]">assignment_turned_in</span>
          </div>
          <div>
            <h3 id="submit-confirm-title" className="text-headline-sm font-bold text-on-surface">
              Submit this {quizLabel}?
            </h3>
            <p className="mt-2 text-body-md text-on-surface-variant">
              After submitting, your answers will be graded and you cannot edit this attempt.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 text-body-sm text-on-surface-variant">
          <div className="flex items-center justify-between gap-3">
            <span>Answered</span>
            <strong className="text-on-surface">{answeredCount}/{questionCount}</strong>
          </div>
          {unansweredCount > 0 && (
            <p className="mt-2 text-amber-800">
              {unansweredCount} question{unansweredCount === 1 ? '' : 's'} still unanswered.
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-outline-variant bg-white px-5 py-3 font-bold text-on-surface"
          >
            Back to questions
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="rounded-lg bg-primary px-5 py-3 font-bold text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit now'}
          </button>
        </div>
      </section>
    </div>
  );
}
