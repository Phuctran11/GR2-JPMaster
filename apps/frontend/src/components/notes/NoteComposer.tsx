import { useEffect, useState } from 'react';
import { lessonNoteAPI, type LessonNote, type LessonNoteType } from '../../services/api';
import { useToastMessages } from '../../hooks/useToastMessages';

interface NoteComposerProps {
  lessonId?: number | null;
  noteType: LessonNoteType;
  questionId?: number | null;
  selectedText?: string | null;
  videoTimestampSeconds?: number | null;
  existingNote?: LessonNote | null;
  title?: string;
  placeholder?: string;
  compact?: boolean;
  onSaved?: (note: LessonNote) => void;
  onDeleted?: (noteId: number) => void;
  onCreated?: () => void;
  onCancel?: () => void;
}

const typeLabels: Record<LessonNoteType, string> = {
  text_note: 'Text note',
  video_note: 'Video note',
  highlight: 'Highlight note',
  question_note: 'Question note',
  ai_summary: 'AI summary',
};

const formatTimestamp = (seconds?: number | null) => {
  if (seconds == null) return null;
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const rest = safeSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
};

const parseTimestamp = (value: string) => {
  const parts = value.trim().split(':').map((part) => Number(part));
  if (parts.length === 0 || parts.length > 3 || parts.some((part) => Number.isNaN(part) || part < 0)) {
    return null;
  }

  const [hoursOrMinutes = 0, minutesOrSeconds = 0, seconds = 0] = parts;
  if (parts.length === 1) return Math.floor(hoursOrMinutes);
  if (parts.length === 2) return Math.floor(hoursOrMinutes * 60 + minutesOrSeconds);
  return Math.floor(hoursOrMinutes * 3600 + minutesOrSeconds * 60 + seconds);
};

export function NoteComposer({
  lessonId,
  noteType,
  questionId,
  selectedText,
  videoTimestampSeconds,
  existingNote,
  title,
  placeholder = 'Write your note...',
  compact = false,
  onSaved,
  onDeleted,
  onCreated,
  onCancel,
}: NoteComposerProps) {
  const toast = useToastMessages();
  const [content, setContent] = useState(existingNote?.note_content ?? '');
  const [isPinned, setIsPinned] = useState(Boolean(existingNote?.is_pinned));
  const [timestampSeconds, setTimestampSeconds] = useState<number | null>(
    videoTimestampSeconds ?? existingNote?.video_timestamp_seconds ?? null
  );
  const [timestampInput, setTimestampInput] = useState(formatTimestamp(videoTimestampSeconds ?? existingNote?.video_timestamp_seconds ?? 0) ?? '00:00:00');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timestampLabel = formatTimestamp(timestampSeconds);
  const selectedTextValue = selectedText ?? existingNote?.selected_text;

  useEffect(() => {
    setContent(existingNote?.note_content ?? '');
    setIsPinned(Boolean(existingNote?.is_pinned));
    const nextTimestamp = videoTimestampSeconds ?? existingNote?.video_timestamp_seconds ?? null;
    setTimestampSeconds(nextTimestamp);
    setTimestampInput(formatTimestamp(nextTimestamp ?? 0) ?? '00:00:00');
  }, [existingNote?.note_id, existingNote?.note_content, existingNote?.is_pinned, existingNote?.video_timestamp_seconds, videoTimestampSeconds]);

  const handleSubmit = async () => {
    if (!content.trim() || saving) return;
    const parsedTimestamp = noteType === 'video_note' ? parseTimestamp(timestampInput) : timestampSeconds;
    if (noteType === 'video_note' && parsedTimestamp == null) {
      setError('Timestamp must use hh:mm:ss, mm:ss, or seconds format.');
      toast.error('Timestamp must use hh:mm:ss, mm:ss, or seconds format.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const result = existingNote
        ? await lessonNoteAPI.updateNote(existingNote.note_id, {
            note_content: content.trim(),
            selected_text: selectedTextValue?.trim() || null,
            video_timestamp_seconds: parsedTimestamp,
            is_pinned: isPinned,
          })
        : await lessonNoteAPI.createNote({
            lesson_id: lessonId ?? null,
            question_id: questionId ?? null,
            note_type: noteType,
            note_content: content.trim(),
            selected_text: selectedTextValue?.trim() || null,
            video_timestamp_seconds: parsedTimestamp,
            is_pinned: isPinned,
          });
      if (!existingNote) {
        setContent('');
        setIsPinned(false);
      }
      setTimestampSeconds(parsedTimestamp);
      onSaved?.(result.data);
      onCreated?.();
      toast.success(existingNote ? 'Note updated successfully.' : 'Note created successfully.');
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Failed to save note';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingNote || saving) return;

    try {
      setSaving(true);
      setError(null);
      await lessonNoteAPI.deleteNote(existingNote.note_id);
      onDeleted?.(existingNote.note_id);
      onCancel?.();
      toast.success('Note deleted successfully.');
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : 'Failed to delete note';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={compact ? 'space-y-3' : 'rounded-xl border border-outline-variant bg-surface p-5 shadow-sm'}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-label-md font-bold uppercase tracking-wide text-primary">{typeLabels[noteType]}</p>
          {title && <h3 className="mt-1 text-title-lg font-bold text-on-surface">{title}</h3>}
          {timestampLabel && <p className="mt-1 text-body-sm text-on-surface-variant">Timestamp {timestampLabel}</p>}
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-label-md text-on-surface-variant">
          <input
            type="checkbox"
            checked={isPinned}
            onChange={(event) => setIsPinned(event.target.checked)}
            className="h-4 w-4"
          />
          Pin
        </label>
      </div>

      {selectedTextValue && (
        <blockquote className="rounded-lg border-l-4 border-primary bg-primary-fixed/40 px-4 py-3 text-body-md text-on-primary-fixed">
          {selectedTextValue}
        </blockquote>
      )}

      {noteType === 'video_note' && (
        <label className="block">
          <span className="mb-1 block text-label-md font-bold text-on-surface">Timestamp</span>
          <input
            type="text"
            inputMode="numeric"
            value={timestampInput}
            onChange={(event) => {
              setTimestampInput(event.target.value);
              const parsed = parseTimestamp(event.target.value);
              if (parsed != null) setTimestampSeconds(parsed);
            }}
            onBlur={() => setTimestampInput(formatTimestamp(parseTimestamp(timestampInput) ?? 0) ?? '00:00:00')}
            className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-body-md text-on-surface outline-none focus:border-primary"
            placeholder="00:01:23"
          />
        </label>
      )}

      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={compact ? 3 : 4}
        className="w-full resize-y rounded-lg border border-outline-variant bg-surface px-4 py-3 text-body-md text-on-surface outline-none focus:border-primary"
        placeholder={placeholder}
      />

      {error && <p className="rounded-lg bg-error-container px-3 py-2 text-body-sm text-on-error-container">{error}</p>}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {existingNote && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="rounded-lg border border-error/40 bg-surface px-4 py-2 font-bold text-on-error-container hover:bg-error-container disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete
          </button>
        )}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-outline-variant bg-surface px-4 py-2 font-bold text-on-surface"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!content.trim() || saving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-bold text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">add_notes</span>
          {saving ? 'Saving...' : existingNote ? 'Update note' : 'Save note'}
        </button>
      </div>
    </section>
  );
}
