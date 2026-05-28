import type { LessonNoteType } from '../../services/api';
import { noteTypeMeta } from './noteMeta';

export function NotesHero({
  noteCount,
  totalPinnedCount,
  countsByType,
  activeNoteType,
  onSelectType,
}: {
  noteCount: number;
  totalPinnedCount: number;
  countsByType: Record<LessonNoteType, number>;
  activeNoteType: LessonNoteType | 'all';
  onSelectType: (type: LessonNoteType | 'all') => void;
}) {
  return (
    <section className="mb-6 rounded-2xl border border-outline-variant bg-surface p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-label-md font-bold uppercase tracking-wide text-primary">Study notes</p>
          <h1 className="mt-2 text-headline-lg font-bold text-on-surface">Notes list</h1>
          <p className="mt-2 max-w-2xl text-body-md text-on-surface-variant">
            Review lesson notes, video timestamps, highlighted text, and quiz question explanations.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[360px]">
          <div className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3">
            <p className="text-label-sm font-bold uppercase tracking-wide text-on-surface-variant">Total</p>
            <p className="mt-1 text-headline-sm font-bold text-on-surface">{noteCount}</p>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary-fixed px-4 py-3 text-on-primary-fixed">
            <p className="text-label-sm font-bold uppercase tracking-wide">Pinned</p>
            <p className="mt-1 text-headline-sm font-bold">{totalPinnedCount}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {(Object.keys(noteTypeMeta) as LessonNoteType[]).map((type) => {
          const meta = noteTypeMeta[type];
          return (
            <button
              key={type}
              type="button"
              onClick={() => onSelectType(activeNoteType === type ? 'all' : type)}
              aria-pressed={activeNoteType === type}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-label-md font-bold transition hover:-translate-y-0.5 ${meta.className} ${
                activeNoteType === type ? 'ring-2 ring-primary/30' : ''
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">{meta.icon}</span>
              {meta.label}
              <span className="rounded-full bg-surface/70 px-2 py-0.5">{countsByType[type]}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
