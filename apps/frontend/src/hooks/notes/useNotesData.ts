import { useEffect, useState } from 'react';
import { lessonNoteAPI, type LessonNote, type LessonNoteFilters, type LessonNoteType } from '../../services/api';
import type { NotesSortOrder } from './useNotesFilters';

export function useNotesData({
  filters,
  countFilters,
  sortOrder,
  page,
  pageSize,
}: {
  filters: LessonNoteFilters;
  countFilters: LessonNoteFilters;
  sortOrder: NotesSortOrder;
  page: number;
  pageSize: number;
}) {
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPinnedCount, setTotalPinnedCount] = useState(0);
  const [countsByType, setCountsByType] = useState<Record<LessonNoteType, number>>({
    text_note: 0,
    video_note: 0,
    highlight: 0,
    question_note: 0,
    ai_summary: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadNotes = async () => {
      try {
        setLoading(true);
        setError(null);
        const [result, countResult] = await Promise.all([
          lessonNoteAPI.getMyNotes({
            ...filters,
            sort_order: sortOrder,
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          lessonNoteAPI.getMyNotes(countFilters),
        ]);
        if (active) {
          setNotes(result.data);
          setTotalCount(result.total_count ?? result.count);
          setTotalPinnedCount(countResult.total_count ?? countResult.count);
          setCountsByType(
            (countResult.counts_by_type || []).reduce<Record<LessonNoteType, number>>(
              (counts, item) => {
                counts[item.note_type] = Number(item.count);
                return counts;
              },
              {
                text_note: 0,
                video_note: 0,
                highlight: 0,
                question_note: 0,
                ai_summary: 0,
              }
            )
          );
        }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Failed to load notes');
      } finally {
        if (active) setLoading(false);
      }
    };

    const timeoutId = window.setTimeout(loadNotes, 200);
    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [filters, countFilters, page, pageSize, sortOrder]);

  const pinnedCount = notes.filter((note) => note.is_pinned).length;

  const handleNoteChanged = (updatedNote: LessonNote) => {
    setNotes((previous) => previous.map((item) => (item.note_id === updatedNote.note_id ? updatedNote : item)));
  };

  const handleNoteDeleted = (noteId: number) => {
    setNotes((previous) => previous.filter((item) => item.note_id !== noteId));
  };

  return {
    notes,
    totalCount,
    loading,
    error,
    pinnedCount,
    totalPinnedCount,
    countsByType,
    handleNoteChanged,
    handleNoteDeleted,
  };
}
