import { useState } from 'react';
import { Link } from 'react-router-dom';
import { lessonNoteAPI, type LessonNote } from '../../services/api';
import { useToastMessages } from '../../hooks/useToastMessages';
import { InteractiveHoverCard } from '../ui';

interface NoteCardProps {
  note: LessonNote;
  onChanged?: (note: LessonNote) => void;
  onDeleted?: (noteId: number) => void;
}

const noteTypeLabels: Record<LessonNote['note_type'], string> = {
  text_note: 'Text note',
  video_note: 'Video note',
  highlight: 'Highlight',
  question_note: 'Question note',
  ai_summary: 'AI summary',
};

const noteTypeStyles: Record<LessonNote['note_type'], { icon: string; badge: string; accent: string; soft: string; title: string }> = {
  text_note: {
    icon: 'notes',
    badge: 'bg-blue-50 text-blue-800 border-blue-200',
    accent: 'bg-blue-600',
    soft: 'bg-blue-50 text-blue-900 border-blue-100',
    title: 'text-blue-800',
  },
  video_note: {
    icon: 'movie',
    badge: 'bg-rose-50 text-rose-800 border-rose-200',
    accent: 'bg-rose-600',
    soft: 'bg-rose-50 text-rose-900 border-rose-100',
    title: 'text-rose-800',
  },
  highlight: {
    icon: 'stylus_note',
    badge: 'bg-yellow-100 text-yellow-950 border-yellow-300',
    accent: 'bg-yellow-500',
    soft: 'bg-yellow-50 text-yellow-950 border-yellow-200',
    title: 'text-yellow-900',
  },
  question_note: {
    icon: 'quiz',
    badge: 'bg-violet-50 text-violet-800 border-violet-200',
    accent: 'bg-violet-600',
    soft: 'bg-violet-50 text-violet-900 border-violet-100',
    title: 'text-violet-800',
  },
  ai_summary: {
    icon: 'auto_awesome',
    badge: 'bg-success-container text-on-success-container border-success/40',
    accent: 'bg-emerald-600',
    soft: 'bg-success-container text-on-success-container border-emerald-100',
    title: 'text-on-success-container',
  },
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

const formatTimestamp = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const rest = safeSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
};

export function NoteCard({ note, onChanged, onDeleted }: NoteCardProps) {
  const toast = useToastMessages();
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const lessonHref = note.course_id && note.lesson_id ? `/courses/${note.course_id}/lessons/${note.lesson_id}` : undefined;
  const courseHref = note.course_id ? `/courses/${note.course_id}` : undefined;
  const finalTestHref = note.course_id && !note.lesson_id && note.quiz_type === 'final_test' ? `/courses/${note.course_id}` : undefined;
  const isHighlightNote = note.note_type === 'highlight';
  const typeStyle = noteTypeStyles[note.note_type];
  const highlightedText = isHighlightNote ? note.selected_text?.trim() || note.note_content : note.selected_text;
  const shouldShowNoteContent = !isHighlightNote || note.note_content.trim() !== highlightedText?.trim();

  const handlePin = async (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.stopPropagation();
    try {
      const result = await lessonNoteAPI.setPinned(note.note_id, !note.is_pinned);
      onChanged?.({ ...note, ...result.data });
      toast.success(result.data.is_pinned ? 'Note pinned.' : 'Note unpinned.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update pinned note');
    }
  };

  const handleDelete = async (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.stopPropagation();
    try {
      await lessonNoteAPI.deleteNote(note.note_id);
      onDeleted?.(note.note_id);
      toast.success('Note deleted successfully.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete note');
    }
  };

  const stopOpeningDetail = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  return (
    <>
    <InteractiveHoverCard className="group rounded-xl" tone={note.is_pinned ? 'primary' : 'secondary'} maxTilt={5}>
      <article
        role="button"
        tabIndex={0}
        onClick={() => setIsDetailOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setIsDetailOpen(true);
          }
        }}
        className={`relative cursor-pointer overflow-hidden rounded-xl border bg-surface p-5 text-left shadow-sm transition ${note.is_pinned ? 'border-primary/40 ring-2 ring-primary/10' : 'border-outline-variant'}`}
      >
        <div className={`absolute inset-y-0 left-0 w-1.5 ${typeStyle.accent}`} />

        <div className="flex flex-col gap-3 pl-1 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-label-sm font-bold ${typeStyle.badge}`}>
                <span className="material-symbols-outlined text-[16px]">{typeStyle.icon}</span>
                {noteTypeLabels[note.note_type]}
              </span>
              {note.is_pinned && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary-fixed px-3 py-1 text-label-sm font-bold text-on-primary-fixed">
                  <span className="material-symbols-outlined text-[16px]">push_pin</span>
                  Pinned
                </span>
              )}
              {note.video_timestamp_seconds != null && (
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-3 py-1 text-label-sm font-bold text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  {formatTimestamp(note.video_timestamp_seconds)}
                </span>
              )}
            </div>
            <p className="mt-2 text-body-sm text-on-surface-variant">Created {formatDateTime(note.created_at)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handlePin}
              aria-pressed={note.is_pinned}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border transition ${
                note.is_pinned
                  ? 'border-primary bg-primary text-on-primary'
                  : 'border-outline-variant bg-surface text-on-surface-variant hover:border-primary hover:text-primary'
              }`}
              title={note.is_pinned ? 'Unpin note' : 'Pin note'}
            >
              <span className="material-symbols-outlined text-[20px]">{note.is_pinned ? 'check_circle' : 'radio_button_unchecked'}</span>
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant bg-surface text-on-surface-variant hover:border-error/40 hover:text-on-error-container"
              title="Delete note"
            >
              <span className="material-symbols-outlined text-[20px]">delete</span>
            </button>
          </div>
        </div>

        {highlightedText && (
          isHighlightNote ? (
            <div className={`mt-4 rounded-lg border px-4 py-3 text-body-md font-semibold leading-7 ${typeStyle.soft}`}>
              <span className={`mb-2 block text-label-sm font-bold uppercase tracking-wide ${typeStyle.title}`}>
                Highlighted text
              </span>
              <span className="rounded px-1 py-0.5" style={{ backgroundColor: '#fde047', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' }}>
                {highlightedText}
              </span>
            </div>
          ) : (
            <blockquote className={`mt-4 rounded-lg border-l-4 px-4 py-3 text-body-md ${typeStyle.soft}`}>
              {highlightedText}
            </blockquote>
          )
        )}

        {note.question_text && (
          <div className="mt-4 rounded-lg border border-violet-100 bg-violet-50 px-4 py-3 text-body-sm text-violet-900">
            <span className="mb-1 block text-label-sm font-bold uppercase tracking-wide text-violet-800">Question</span>
            {note.question_text}
          </div>
        )}

        {shouldShowNoteContent && (
          <p className="mt-4 line-clamp-6 whitespace-pre-line text-body-md leading-7 text-on-surface">{note.note_content}</p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-outline-variant pt-4 text-body-sm text-on-surface-variant">
          {lessonHref ? (
            <Link to={lessonHref} onClick={stopOpeningDetail} className="inline-flex items-center gap-1 font-bold text-primary hover:underline">
              <span className="material-symbols-outlined text-[18px]">school</span>
              {note.lesson_title || `Lesson ${note.lesson_id}`}
            </Link>
          ) : finalTestHref ? (
            <Link to={finalTestHref} onClick={stopOpeningDetail} className="inline-flex items-center gap-1 font-bold text-primary hover:underline">
              <span className="material-symbols-outlined text-[18px]">assignment</span>
              Final test question
            </Link>
          ) : courseHref && !note.lesson_id ? (
            <Link to={courseHref} onClick={stopOpeningDetail} className="inline-flex items-center gap-1 font-bold text-primary hover:underline">
              <span className="material-symbols-outlined text-[18px]">school</span>
              Course question
            </Link>
          ) : note.lesson_id ? (
            <span>Lesson {note.lesson_id}</span>
          ) : (
            <span>Final test question</span>
          )}
          {note.course_title && <span>{note.course_title}</span>}
        </div>
      </article>
    </InteractiveHoverCard>

    {isDetailOpen && (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4"
        role="dialog"
        aria-modal="true"
        onClick={() => setIsDetailOpen(false)}
      >
        <section
          className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-xl bg-surface shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="flex items-start justify-between gap-4 border-b border-outline-variant px-5 py-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-label-sm font-bold ${typeStyle.badge}`}>
                  <span className="material-symbols-outlined text-[16px]">{typeStyle.icon}</span>
                  {noteTypeLabels[note.note_type]}
                </span>
                {note.is_pinned && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary-fixed px-3 py-1 text-label-sm font-bold text-on-primary-fixed">
                    <span className="material-symbols-outlined text-[16px]">push_pin</span>
                    Pinned
                  </span>
                )}
              </div>
              <p className="mt-2 text-body-sm text-on-surface-variant">Created {formatDateTime(note.created_at)}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsDetailOpen(false)}
              className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container"
              aria-label="Close note detail"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </header>

          <div className="max-h-[calc(88vh-92px)] overflow-y-auto px-5 py-5">
            {highlightedText && (
              <div className={`mb-4 rounded-lg border px-4 py-3 text-body-md leading-7 ${typeStyle.soft}`}>
                <span className={`mb-2 block text-label-sm font-bold uppercase tracking-wide ${typeStyle.title}`}>
                  {isHighlightNote ? 'Highlighted text' : 'Selected text'}
                </span>
                <div className="whitespace-pre-line">{highlightedText}</div>
              </div>
            )}

            {note.question_text && (
              <div className="mb-4 rounded-lg border border-violet-100 bg-violet-50 px-4 py-3 text-body-sm text-violet-900">
                <span className="mb-1 block text-label-sm font-bold uppercase tracking-wide text-violet-800">Question</span>
                {note.question_text}
              </div>
            )}

            {shouldShowNoteContent ? (
              <div className="whitespace-pre-line text-body-md leading-7 text-on-surface">{note.note_content}</div>
            ) : (
              <p className="text-body-md text-on-surface-variant">No additional note content.</p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-outline-variant pt-4 text-body-sm text-on-surface-variant">
              {note.lesson_title && <span>{note.lesson_title}</span>}
              {note.course_title && <span>{note.course_title}</span>}
              {note.video_timestamp_seconds != null && <span>Timestamp {formatTimestamp(note.video_timestamp_seconds)}</span>}
            </div>
          </div>
        </section>
      </div>
    )}
    </>
  );
}
