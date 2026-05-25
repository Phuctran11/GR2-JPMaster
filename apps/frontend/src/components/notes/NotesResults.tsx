import type { LessonNote } from '../../services/api';
import { NoteCard } from './NoteCard';

export function NotesResults({
  notes,
  loading,
  error,
  pinnedCount,
  totalCount,
  onNoteChanged,
  onNoteDeleted,
}: {
  notes: LessonNote[];
  loading: boolean;
  error: string | null;
  pinnedCount: number;
  totalCount: number;
  onNoteChanged: (note: LessonNote) => void;
  onNoteDeleted: (noteId: number) => void;
}) {
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-body-sm text-on-surface-variant">
        <span>{loading ? 'Loading notes...' : `${totalCount} notes found`}</span>
        <span>{pinnedCount} pinned in results</span>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-red-700">{error}</p>}

      {!loading && notes.length === 0 ? (
        <section className="rounded-xl border border-dashed border-outline-variant bg-white p-8 text-center text-on-surface-variant">
          No notes match the current filters.
        </section>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {notes.map((note) => (
            <NoteCard
              key={note.note_id}
              note={note}
              onChanged={onNoteChanged}
              onDeleted={onNoteDeleted}
            />
          ))}
        </div>
      )}
    </>
  );
}
