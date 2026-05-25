import { NoteComposer } from '../notes';
import type { LessonNote } from '../../services/api';

export function LessonNoteDialog({
  lessonId,
  noteType,
  title,
  selectedText,
  videoTimestampSeconds,
  existingNote,
  onSaved,
  onDeleted,
  onClose,
}: {
  lessonId: number;
  noteType: 'highlight' | 'video_note';
  title: string;
  selectedText?: string;
  videoTimestampSeconds?: number;
  existingNote: LessonNote | null;
  onSaved: (note: LessonNote) => void;
  onDeleted: (noteId: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
        <NoteComposer
          lessonId={lessonId}
          noteType={noteType}
          selectedText={selectedText}
          videoTimestampSeconds={videoTimestampSeconds}
          existingNote={existingNote}
          title={title}
          compact
          onSaved={onSaved}
          onDeleted={onDeleted}
          onCreated={onClose}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
