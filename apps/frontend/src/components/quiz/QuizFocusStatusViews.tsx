export function QuizFocusStartView({
  onStart,
  onBack,
}: {
  onStart: () => void;
  onBack: () => void;
}) {
  return (
    <main className="fixed inset-0 z-[70] flex items-center justify-center bg-surface-container-low p-6">
      <section className="w-full max-w-xl rounded-xl border border-outline-variant bg-white p-6 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-fixed text-on-primary-fixed">
          <span className="material-symbols-outlined text-[30px]">assignment</span>
        </div>
        <h1 className="text-headline-md font-bold text-on-surface">Ready to start the final test?</h1>
        <p className="mt-3 text-body-md text-on-surface-variant">
          Once you start, focus mode will be locked and the timer will begin. You must submit the test before leaving.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onStart}
            className="rounded-lg bg-primary px-5 py-3 font-bold text-on-primary"
          >
            Start final test
          </button>
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-outline-variant bg-white px-5 py-3 font-bold text-on-surface"
          >
            Back to course
          </button>
        </div>
      </section>
    </main>
  );
}

export function QuizFocusLoadingView() {
  return (
    <main className="fixed inset-0 z-[70] flex items-center justify-center bg-surface-container-low">
      <p className="text-on-surface-variant">Preparing focus mode...</p>
    </main>
  );
}

export function QuizFocusUnavailableView({
  message,
  onBack,
}: {
  message: string;
  onBack: () => void;
}) {
  return (
    <main className="fixed inset-0 z-[70] flex items-center justify-center bg-surface-container-low p-6">
      <section className="max-w-xl rounded-xl border border-outline-variant bg-white p-6 text-center shadow-lg">
        <h1 className="text-headline-md font-bold text-on-surface">Quiz unavailable</h1>
        <p className="mt-2 text-on-surface-variant">{message}</p>
        <button type="button" onClick={onBack} className="mt-5 rounded-lg bg-primary px-5 py-3 font-bold text-on-primary">
          Back
        </button>
      </section>
    </main>
  );
}
