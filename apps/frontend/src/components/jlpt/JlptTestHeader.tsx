import { Container } from '../ui';
import type { JlptExamDetail, JlptExamSection } from '../../services/api';
import { formatTime, sectionLabels, type JlptTestPhase } from './jlptTestUtils';

export function JlptTestHeader({
  exam,
  phase,
  activeSection,
  activeSectionIndex,
  remainingSeconds,
  onExit,
}: {
  exam: JlptExamDetail;
  phase: JlptTestPhase;
  activeSection: JlptExamSection | null;
  activeSectionIndex: number;
  remainingSeconds: number;
  onExit: () => void;
}) {
  return (
    <div className="sticky top-0 z-10 border-b border-outline-variant bg-surface/95 backdrop-blur">
      <Container>
        <div className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-label-md font-bold uppercase tracking-wide text-primary">JLPT focus mode</p>
            <h1 className="mt-1 text-headline-sm font-bold text-on-surface">{exam.title}</h1>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              Section {activeSectionIndex + 1}/{exam.sections.length}: {activeSection?.title || sectionLabels[activeSection?.section_type ?? '']}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {phase === 'section' && (
              <div className={`rounded-xl border px-4 py-3 font-bold ${remainingSeconds <= 60 ? 'border-error/40 bg-error-container text-on-error-container' : 'border-primary/20 bg-primary-fixed text-on-primary-fixed'}`}>
                <span className="mr-2 align-middle material-symbols-outlined text-[20px]">timer</span>
                {formatTime(remainingSeconds)}
              </div>
            )}
            {phase === 'submitted' && (
              <button type="button" onClick={onExit} className="rounded-lg bg-primary px-5 py-3 font-bold text-on-primary">
                Exit focus mode
              </button>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
