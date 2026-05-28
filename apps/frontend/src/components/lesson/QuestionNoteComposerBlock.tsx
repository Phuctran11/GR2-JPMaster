import { NoteComposer } from '../notes';
import type { LessonNote } from '../../services/api';

export function QuestionNoteComposerBlock({
  lessonId,
  questionId,
  questionNumber,
  existingQuestionNote,
  onSaved,
  onDeleted,
}: {
  lessonId: number | null;
  questionId: number;
  questionNumber: number;
  existingQuestionNote: LessonNote | null;
  onSaved: (savedNote: LessonNote) => void;
  onDeleted: (noteId: number) => void;
}) {
  return (
    <details className="mt-3 rounded-lg border border-outline-variant bg-surface p-3">
      <summary className="cursor-pointer text-label-md font-bold text-primary">
        {existingQuestionNote ? 'Question note saved' : 'Add question note'}
        {existingQuestionNote && (
          <span className="ml-2 rounded-full bg-success-container px-2 py-1 text-label-sm text-on-success-container">noted</span>
        )}
      </summary>
      <div className="mt-3">
        <NoteComposer
          lessonId={lessonId}
          questionId={questionId}
          noteType="question_note"
          existingNote={existingQuestionNote}
          title={`Question ${questionNumber}`}
          placeholder="Why was this answer right or wrong?"
          compact
          onSaved={onSaved}
          onDeleted={onDeleted}
        />
      </div>
    </details>
  );
}
