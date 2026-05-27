import { Container } from '../ui';
import { JlptSectionPanel } from './JlptSectionPanel';
import { JlptSectionSubmitDialog } from './JlptSectionSubmitDialog';
import { JlptTestHeader } from './JlptTestHeader';
import type { useJlptTestController } from '../../hooks/jlpt/useJlptTestController';

type JlptController = ReturnType<typeof useJlptTestController>;

export function JlptFocusView({
  controller,
  onExit,
}: {
  controller: JlptController;
  onExit: () => void;
}) {
  const {
    exam,
    answers,
    result,
    phase,
    activeSectionIndex,
    activeSection,
    questions,
    sectionsToRender,
    activeSectionAnsweredCount,
    totalAnsweredCount,
    remainingSeconds,
    submitting,
    showSectionSubmitConfirm,
    setShowSectionSubmitConfirm,
    getUnansweredCount,
    finishSection,
    performFinishSection,
    resetTest,
    setSingleOption,
    toggleMultipleOption,
    setTextAnswer,
  } = controller;

  if (!exam) return null;

  return (
    <main className="fixed inset-0 z-[70] overflow-y-auto bg-surface-container-low">
      <JlptTestHeader
        exam={exam}
        phase={phase}
        activeSection={activeSection}
        activeSectionIndex={activeSectionIndex}
        remainingSeconds={remainingSeconds}
        onExit={onExit}
      />

      <Container className="py-6 md:py-8">
        <div className="mx-auto max-w-4xl space-y-5">
          {phase === 'section' && (
            <section className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
              Focus mode is locked. Finish this section to continue. Answered {activeSectionAnsweredCount}/{activeSection?.questions.length ?? 0}.
            </section>
          )}

          {phase === 'submitted' && result && (
            <section className={`rounded-xl border p-5 ${result.passed ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-red-300 bg-red-50 text-red-800'}`}>
              <h2 className="text-headline-sm font-bold">{result.passed ? 'Passed' : 'Not passed'} - {result.score.toFixed(2)}%</h2>
              <p className="mt-1 text-body-md">{result.earned_marks}/{result.total_marks} marks</p>
              <button type="button" onClick={resetTest} className="mt-4 rounded-lg bg-primary px-5 py-3 font-bold text-on-primary">
                Retake test
              </button>
            </section>
          )}

          {sectionsToRender.map((section, sectionRenderIndex) => (
            <JlptSectionPanel
              key={section.section_id}
              section={section}
              sectionRenderIndex={sectionRenderIndex}
              answers={answers}
              result={result}
              phase={phase}
              onSingleOption={setSingleOption}
              onToggleMultipleOption={toggleMultipleOption}
              onTextAnswer={setTextAnswer}
            />
          ))}

          {phase === 'section' && (
            <section className="sticky bottom-4 z-20 rounded-lg border border-outline-variant bg-white p-4 shadow-lg">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-body-md text-on-surface-variant">
                  Total answered {totalAnsweredCount}/{questions.length}
                </p>
                <button
                  type="button"
                  onClick={finishSection}
                  disabled={submitting}
                  className="rounded-lg bg-primary px-5 py-3 font-bold text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {activeSectionIndex >= exam.sections.length - 1 ? (submitting ? 'Submitting...' : 'Submit test') : 'Finish section'}
                </button>
              </div>
            </section>
          )}

          {showSectionSubmitConfirm && activeSection && (
            <JlptSectionSubmitDialog
              activeSection={activeSection}
              activeSectionIndex={activeSectionIndex}
              sectionCount={exam.sections.length}
              activeSectionAnsweredCount={activeSectionAnsweredCount}
              remainingSeconds={remainingSeconds}
              unansweredCount={getUnansweredCount(activeSection)}
              submitting={submitting}
              onCancel={() => setShowSectionSubmitConfirm(false)}
              onConfirm={performFinishSection}
            />
          )}
        </div>
      </Container>
    </main>
  );
}
