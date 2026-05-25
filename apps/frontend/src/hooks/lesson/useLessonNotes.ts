import { useCallback, useEffect, useMemo, useState } from 'react';
import { lessonNoteAPI, type Lesson as LessonData, type LessonNote } from '../../services/api';

export function useLessonNotes({
  currentLesson,
  highlightText,
  aiSelectedText,
}: {
  currentLesson?: LessonData;
  highlightText: string | null;
  aiSelectedText: string | null;
}) {
  const [videoNoteDraft, setVideoNoteDraft] = useState<{ timestamp: number | null; note: LessonNote | null } | null>(null);
  const [lessonNotes, setLessonNotes] = useState<LessonNote[]>([]);

  const textNote = useMemo(() => lessonNotes.find((note) => note.note_type === 'text_note') ?? null, [lessonNotes]);
  const videoNotes = useMemo(() => lessonNotes.filter((note) => note.note_type === 'video_note'), [lessonNotes]);
  const highlightNotes = useMemo(() => lessonNotes.filter((note) => note.note_type === 'highlight' && note.selected_text?.trim()), [lessonNotes]);
  const activeHighlightNote = useMemo(() => {
    return highlightText
      ? lessonNotes.find((note) => note.note_type === 'highlight' && note.selected_text === highlightText) ?? null
      : null;
  }, [highlightText, lessonNotes]);

  const handleNoteSaved = useCallback((savedNote: LessonNote) => {
    setLessonNotes((previous) => {
      const exists = previous.some((note) => note.note_id === savedNote.note_id);
      return exists
        ? previous.map((note) => (note.note_id === savedNote.note_id ? { ...note, ...savedNote } : note))
        : [savedNote, ...previous];
    });
  }, []);

  const handleNoteDeleted = useCallback((noteId: number) => {
    setLessonNotes((previous) => previous.filter((note) => note.note_id !== noteId));
  }, []);

  const handleSaveAiSummaryNote = useCallback(
    async (answer: string) => {
      if (!currentLesson) return;

      const savedNote = await lessonNoteAPI.createNote({
        lesson_id: currentLesson.lesson_id,
        note_type: 'ai_summary',
        note_content: answer,
        selected_text: aiSelectedText,
      });
      handleNoteSaved(savedNote.data);
    },
    [aiSelectedText, currentLesson, handleNoteSaved]
  );

  const handleAddVideoNote = useCallback(
    (timestamp: number | null) => {
      const normalizedTimestamp = Math.max(0, Math.floor(timestamp ?? 0));
      const existingNote = videoNotes.find((note) => note.video_timestamp_seconds === normalizedTimestamp) ?? null;
      setVideoNoteDraft({ timestamp: normalizedTimestamp, note: existingNote });
    },
    [videoNotes]
  );

  useEffect(() => {
    if (!currentLesson) {
      setLessonNotes([]);
      return;
    }

    let active = true;
    const loadLessonNotes = async () => {
      try {
        const result = await lessonNoteAPI.getMyNotes({ lesson_id: currentLesson.lesson_id, limit: 100 });
        if (active) setLessonNotes(result.data);
      } catch {
        if (active) setLessonNotes([]);
      }
    };

    loadLessonNotes();

    return () => {
      active = false;
    };
  }, [currentLesson]);

  return {
    lessonNotes,
    textNote,
    videoNotes,
    highlightNotes,
    activeHighlightNote,
    videoNoteDraft,
    setVideoNoteDraft,
    handleNoteSaved,
    handleNoteDeleted,
    handleSaveAiSummaryNote,
    handleAddVideoNote,
  };
}
