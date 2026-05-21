import { useEffect, useMemo, useState } from 'react';
import { Header, Footer, Container, Breadcrumbs } from '../components';
import { NoteCard } from '../components/notes';
import { lessonNoteAPI, type LessonNote, type LessonNoteType } from '../services/api';

const noteTypeOptions: Array<{ value: LessonNoteType | 'all'; label: string }> = [
  { value: 'all', label: 'All types' },
  { value: 'text_note', label: 'Text notes' },
  { value: 'video_note', label: 'Video notes' },
  { value: 'highlight', label: 'Highlights' },
  { value: 'question_note', label: 'Question notes' },
  { value: 'ai_summary', label: 'AI summaries' },
];

const noteTypeMeta: Record<LessonNoteType, { label: string; icon: string; className: string }> = {
  text_note: { label: 'Text', icon: 'notes', className: 'border-blue-200 bg-blue-50 text-blue-800' },
  video_note: { label: 'Video', icon: 'movie', className: 'border-rose-200 bg-rose-50 text-rose-800' },
  highlight: { label: 'Highlight', icon: 'stylus_note', className: 'border-yellow-300 bg-yellow-100 text-yellow-950' },
  question_note: { label: 'Question', icon: 'quiz', className: 'border-violet-200 bg-violet-50 text-violet-800' },
  ai_summary: { label: 'AI', icon: 'auto_awesome', className: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
};

export default function Notes() {
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [countSourceNotes, setCountSourceNotes] = useState<LessonNote[]>([]);
  const [noteType, setNoteType] = useState<LessonNoteType | 'all'>('all');
  const [pinned, setPinned] = useState<'all' | 'true' | 'false'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasActiveFilters = Boolean(search.trim()) || noteType !== 'all' || pinned !== 'all' || sortOrder !== 'newest';

  const filters = useMemo(
    () => ({
      note_type: noteType,
      pinned: pinned === 'all' ? 'all' as const : pinned === 'true',
      search,
      limit: 100,
    }),
    [noteType, pinned, search]
  );

  const countFilters = useMemo(
    () => ({
      note_type: 'all' as const,
      pinned: pinned === 'all' ? 'all' as const : pinned === 'true',
      search,
      limit: 100,
    }),
    [pinned, search]
  );

  useEffect(() => {
    let active = true;

    const loadNotes = async () => {
      try {
        setLoading(true);
        setError(null);
        const [result, countResult] = await Promise.all([
          lessonNoteAPI.getMyNotes(filters),
          lessonNoteAPI.getMyNotes(countFilters),
        ]);
        if (active) {
          setNotes(
            [...result.data].sort((a, b) => {
              const aTime = new Date(a.created_at).getTime();
              const bTime = new Date(b.created_at).getTime();
              return sortOrder === 'newest' ? bTime - aTime : aTime - bTime;
            })
          );
          setCountSourceNotes(countResult.data);
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
  }, [filters, countFilters, sortOrder]);

  const pinnedCount = notes.filter((note) => note.is_pinned).length;
  const totalPinnedCount = countSourceNotes.filter((note) => note.is_pinned).length;
  const countsByType = countSourceNotes.reduce<Record<LessonNoteType, number>>(
    (counts, note) => {
      counts[note.note_type] += 1;
      return counts;
    },
    {
      text_note: 0,
      video_note: 0,
      highlight: 0,
      question_note: 0,
      ai_summary: 0,
    }
  );

  const clearFilters = () => {
    setSearch('');
    setNoteType('all');
    setPinned('all');
    setSortOrder('newest');
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: 'Notes' }]} />

      <main className="flex-1 bg-surface-container-low py-10 md:py-12">
        <Container>
          <section className="mb-6 rounded-2xl border border-outline-variant bg-white p-5 shadow-sm md:p-6">
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
                  <p className="mt-1 text-headline-sm font-bold text-on-surface">{notes.length}</p>
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
                    onClick={() => setNoteType(type)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-label-md font-bold transition hover:-translate-y-0.5 ${meta.className} ${
                      noteType === type ? 'ring-2 ring-primary/30' : ''
                    }`}
                  >
                    <span className="material-symbols-outlined text-[17px]">{meta.icon}</span>
                    {meta.label}
                    <span className="rounded-full bg-white/70 px-2 py-0.5">{countsByType[type]}</span>
                  </button>
                );
              })}
            </div>
          </section>

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
                onClick={clearFilters}
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
                    onChange={(event) => setSearch(event.target.value)}
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
                  onChange={(event) => setNoteType(event.target.value as LessonNoteType | 'all')}
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
                      onChange={(event) => setPinned(event.target.value as 'all' | 'true' | 'false')}
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
                      onChange={(event) => setSortOrder(event.target.value as 'newest' | 'oldest')}
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
                    onClick={() => setSearch('')}
                    className="inline-flex items-center gap-1 rounded-full bg-surface-container px-3 py-1 text-label-sm font-bold text-on-surface-variant hover:bg-surface-container-high"
                  >
                    Search: {search.trim()}
                    <span className="material-symbols-outlined text-[15px]">close</span>
                  </button>
                )}
                {noteType !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setNoteType('all')}
                    className="inline-flex items-center gap-1 rounded-full bg-primary-fixed px-3 py-1 text-label-sm font-bold text-on-primary-fixed hover:opacity-85"
                  >
                    {noteTypeOptions.find((option) => option.value === noteType)?.label}
                    <span className="material-symbols-outlined text-[15px]">close</span>
                  </button>
                )}
                {pinned !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setPinned('all')}
                    className="inline-flex items-center gap-1 rounded-full bg-primary-fixed px-3 py-1 text-label-sm font-bold text-on-primary-fixed hover:opacity-85"
                  >
                    {pinned === 'true' ? 'Pinned only' : 'Unpinned only'}
                    <span className="material-symbols-outlined text-[15px]">close</span>
                  </button>
                )}
                {sortOrder !== 'newest' && (
                  <button
                    type="button"
                    onClick={() => setSortOrder('newest')}
                    className="inline-flex items-center gap-1 rounded-full bg-surface-container px-3 py-1 text-label-sm font-bold text-on-surface-variant hover:bg-surface-container-high"
                  >
                    Oldest first
                    <span className="material-symbols-outlined text-[15px]">close</span>
                  </button>
                )}
              </div>
            )}
          </section>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-body-sm text-on-surface-variant">
            <span>{loading ? 'Loading notes...' : `${notes.length} notes found`}</span>
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
                  onChanged={(updatedNote) =>
                    setNotes((previous) => previous.map((item) => (item.note_id === updatedNote.note_id ? updatedNote : item)))
                  }
                  onDeleted={(noteId) => setNotes((previous) => previous.filter((item) => item.note_id !== noteId))}
                />
              ))}
            </div>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}
