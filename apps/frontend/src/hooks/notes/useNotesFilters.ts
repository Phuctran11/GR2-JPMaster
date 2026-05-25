import { useMemo, useState } from 'react';
import type { LessonNoteType } from '../../services/api';

export type NotesPinnedFilter = 'all' | 'true' | 'false';
export type NotesSortOrder = 'newest' | 'oldest';

export function useNotesFilters() {
  const [noteType, setNoteType] = useState<LessonNoteType | 'all'>('all');
  const [pinned, setPinned] = useState<NotesPinnedFilter>('all');
  const [sortOrder, setSortOrder] = useState<NotesSortOrder>('newest');
  const [search, setSearch] = useState('');
  const hasActiveFilters = Boolean(search.trim()) || noteType !== 'all' || pinned !== 'all' || sortOrder !== 'newest';

  const filters = useMemo(
    () => ({
      note_type: noteType,
      pinned: pinned === 'all' ? 'all' as const : pinned === 'true',
      search,
    }),
    [noteType, pinned, search]
  );

  const countFilters = useMemo(
    () => ({
      note_type: 'all' as const,
      pinned: pinned === 'all' ? 'all' as const : pinned === 'true',
      search,
    }),
    [pinned, search]
  );

  const clearFilters = () => {
    setSearch('');
    setNoteType('all');
    setPinned('all');
    setSortOrder('newest');
  };

  return {
    noteType,
    setNoteType,
    pinned,
    setPinned,
    sortOrder,
    setSortOrder,
    search,
    setSearch,
    hasActiveFilters,
    filters,
    countFilters,
    clearFilters,
  };
}
