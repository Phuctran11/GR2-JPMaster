import { sectionLabels, formatTime, getSectionSeconds } from './jlptTestUtils';
import type { JlptExamDetail } from '../../services/api';

export function JlptLoadingView() {
  return (
    <main className="fixed inset-0 z-[70] flex items-center justify-center bg-surface-container-low">
      <p className="text-on-surface-variant">Preparing JLPT focus mode...</p>
    </main>
  );
}

export function JlptUnavailableView({
  message,
  onBack,
}: {
  message: string;
  onBack: () => void;
}) {
  return (
    <main className="fixed inset-0 z-[70] flex items-center justify-center bg-surface-container-low p-6">
      <section className="max-w-xl rounded-xl border border-outline-variant bg-surface p-6 text-center shadow-lg">
        <h1 className="text-headline-md font-bold text-on-surface">JLPT test unavailable</h1>
        <p className="mt-2 text-on-surface-variant">{message}</p>
        <button type="button" onClick={onBack} className="mt-5 rounded-lg bg-primary px-5 py-3 font-bold text-on-primary">
          Back to tests
        </button>
      </section>
    </main>
  );
}

export function JlptIntroView({
  exam,
  onStart,
  onBack,
}: {
  exam: JlptExamDetail;
  onStart: () => void;
  onBack: () => void;
}) {
  return (
    <main className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-surface-container-low p-6">
      <section className="w-full max-w-2xl rounded-xl border border-outline-variant bg-surface p-6 shadow-lg">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-fixed text-on-primary-fixed">
          <span className="material-symbols-outlined text-[30px]">assignment</span>
        </div>
        <h1 className="text-center text-headline-md font-bold text-on-surface">{exam.title}</h1>
        <p className="mt-2 text-center text-body-md text-on-surface-variant">JLPT {exam.jlpt_level} focus mode</p>

        <div className="mt-6 space-y-3">
          {exam.sections.map((section, index) => (
            <div key={section.section_id} className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3">
              <div>
                <p className="font-bold text-on-surface">{index + 1}. {section.title || sectionLabels[section.section_type]}</p>
                <p className="text-label-md text-on-surface-variant">{section.questions.length} questions</p>
              </div>
              <span className="rounded-full bg-primary-fixed px-3 py-1 text-label-md font-bold text-on-primary-fixed">
                {Math.ceil(getSectionSeconds(section, exam) / 60)} min
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-lg border border-warning/40 bg-warning-container p-4 text-body-md text-on-warning-container">
          Each section has its own timer. Between sections, you get a 2-minute break. Once focus mode starts, submit the test before leaving.
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" onClick={onStart} className="rounded-lg bg-primary px-6 py-3 font-bold text-on-primary">
            Start test
          </button>
          <button type="button" onClick={onBack} className="rounded-lg border border-outline-variant bg-surface px-6 py-3 font-bold text-on-surface">
            Back to tests
          </button>
        </div>
      </section>
    </main>
  );
}

export function JlptBreakView({
  nextSectionTitle,
  remainingSeconds,
  onStartNext,
}: {
  nextSectionTitle: string;
  remainingSeconds: number;
  onStartNext: () => void;
}) {
  return (
    <main className="fixed inset-0 z-[70] flex items-center justify-center bg-surface-container-low p-6">
      <section className="w-full max-w-xl rounded-xl border border-outline-variant bg-surface p-6 text-center shadow-lg">
        <p className="text-label-md font-bold uppercase text-primary">Break time</p>
        <h1 className="mt-2 text-headline-md font-bold text-on-surface">{formatTime(remainingSeconds)}</h1>
        <p className="mt-3 text-body-md text-on-surface-variant">
          Next section: <strong>{nextSectionTitle}</strong>
        </p>
        <button type="button" onClick={onStartNext} className="mt-6 rounded-lg bg-primary px-6 py-3 font-bold text-on-primary">
          Start next section
        </button>
      </section>
    </main>
  );
}
