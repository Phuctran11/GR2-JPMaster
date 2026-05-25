import type { LessonNoteType } from '../../services/api';
import { noteTypeOptions } from './noteMeta';
import type { NotesPinnedFilter, NotesSortOrder } from '../../hooks/notes/useNotesFilters';

export function NotesFilterPanel({
  search,
  noteType,
  pinned,
  sortOrder,
  hasActiveFilters,
  onSearchChange,
  onNoteTypeChange,
  onPinnedChange,
  onSortOrderChange,
  onClearFilters,
}: {
  search: string;
  noteType: LessonNoteType | 'all';
  pinned: NotesPinnedFilter;
  sortOrder: NotesSortOrder;
  hasActiveFilters: boolean;
  onSearchChange: (value: string) => void;
  onNoteTypeChange: (value: LessonNoteType | 'all') => void;
  onPinnedChange: (value: NotesPinnedFilter) => void;
  onSortOrderChange: (value: NotesSortOrder) => void;
  onClearFilters: () => void;
}) {
  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-outline-variant bg-surface-container-low px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary">
            <span className="material-symbols-outlined text-[22px]">tune</span>
          </span>
          <div>
            <h2 className="text-title-md font-bold text-on-surface">Filter notes</h2>
            <p className="text-body-sm text-on-surface-variant">Narrow by type, pin status, and time.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClearFilters}
          disabled={!hasActiveFilters}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-white px-4 py-2 font-bold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">restart_alt</span>
          Clear filters
        </button>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(280px,1fr)_210px_minmax(260px,360px)]">
        <label className="block">
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">
              search
            </span>
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              className="w-full rounded-xl border border-outline-variant bg-white py-3 pl-11 pr-4 outline-none focus:border-primary"
              placeholder="Search note content or selected text"
            />
          </div>
        </label>
        <label className="block">
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[19px] text-on-surface-variant">
              category
            </span>
            <select
              value={noteType}
              onChange={(event) => onNoteTypeChange(event.target.value as LessonNoteType | 'all')}
              className="w-full appearance-none rounded-xl border border-outline-variant bg-white py-3 pl-10 pr-9 outline-none focus:border-primary"
            >
              {noteTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
              expand_more
            </span>
          </div>
        </label>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
          <label className="block">
            <div className="relative">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[19px] text-on-surface-variant">
                push_pin
              </span>
              <select
                value={pinned}
                onChange={(event) => onPinnedChange(event.target.value as NotesPinnedFilter)}
                className="w-full appearance-none rounded-xl border border-outline-variant bg-white py-3 pl-10 pr-9 outline-none focus:border-primary"
              >
                <option value="all">All notes</option>
                <option value="true">Pinned only</option>
                <option value="false">Unpinned only</option>
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                expand_more
              </span>
            </div>
          </label>
          <label className="block">
            <div className="relative">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[19px] text-on-surface-variant">
                schedule
              </span>
              <select
                value={sortOrder}
                onChange={(event) => onSortOrderChange(event.target.value as NotesSortOrder)}
                className="w-full appearance-none rounded-xl border border-outline-variant bg-white py-3 pl-10 pr-9 outline-none focus:border-primary"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                expand_more
              </span>
            </div>
          </label>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 border-t border-outline-variant px-4 py-3">
          {search.trim() && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="inline-flex items-center gap-1 rounded-full bg-surface-container px-3 py-1 text-label-sm font-bold text-on-surface-variant hover:bg-surface-container-high"
            >
              Search: {search.trim()}
              <span className="material-symbols-outlined text-[15px]">close</span>
            </button>
          )}
          {noteType !== 'all' && (
            <button
              type="button"
              onClick={() => onNoteTypeChange('all')}
              className="inline-flex items-center gap-1 rounded-full bg-primary-fixed px-3 py-1 text-label-sm font-bold text-on-primary-fixed hover:opacity-85"
            >
              {noteTypeOptions.find((option) => option.value === noteType)?.label}
              <span className="material-symbols-outlined text-[15px]">close</span>
            </button>
          )}
          {pinned !== 'all' && (
            <button
              type="button"
              onClick={() => onPinnedChange('all')}
              className="inline-flex items-center gap-1 rounded-full bg-primary-fixed px-3 py-1 text-label-sm font-bold text-on-primary-fixed hover:opacity-85"
            >
              {pinned === 'true' ? 'Pinned only' : 'Unpinned only'}
              <span className="material-symbols-outlined text-[15px]">close</span>
            </button>
          )}
          {sortOrder !== 'newest' && (
            <button
              type="button"
              onClick={() => onSortOrderChange('newest')}
              className="inline-flex items-center gap-1 rounded-full bg-surface-container px-3 py-1 text-label-sm font-bold text-on-surface-variant hover:bg-surface-container-high"
            >
              Oldest first
              <span className="material-symbols-outlined text-[15px]">close</span>
            </button>
          )}
        </div>
      )}
    </section>
  );
}
