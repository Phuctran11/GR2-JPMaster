import { useEffect, useState } from 'react';
import { Header, Footer, Container, Breadcrumbs } from '../components';
import { Pagination } from '../components/Pagination';
import { MotionSectionFrame } from '../components/ui';
import { NotesFilterPanel, NotesHero, NotesResults } from '../components/notes';
import { useNotesData } from '../hooks/notes/useNotesData';
import { useNotesFilters } from '../hooks/notes/useNotesFilters';

export default function Notes() {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const {
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
  } = useNotesFilters();
  const {
    notes,
    totalCount,
    loading,
    error,
    pinnedCount,
    totalPinnedCount,
    countsByType,
    handleNoteChanged,
    handleNoteDeleted,
  } = useNotesData({ filters, countFilters, sortOrder, page, pageSize });

  useEffect(() => {
    setPage(1);
  }, [filters, sortOrder]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(totalCount / pageSize));
    if (page > maxPage) setPage(maxPage);
  }, [page, totalCount]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: 'Notes' }]} />

      <main className="flex-1 bg-surface-container-low py-10 md:py-12">
        <Container>
          <MotionSectionFrame index={0} preset="hero">
            <NotesHero
              noteCount={totalCount}
              totalPinnedCount={totalPinnedCount}
              countsByType={countsByType}
              activeNoteType={noteType}
              onSelectType={setNoteType}
            />
          </MotionSectionFrame>
          <MotionSectionFrame index={1} preset="sweep">
            <NotesFilterPanel
              search={search}
              noteType={noteType}
              pinned={pinned}
              sortOrder={sortOrder}
              hasActiveFilters={hasActiveFilters}
              onSearchChange={setSearch}
              onNoteTypeChange={setNoteType}
              onPinnedChange={setPinned}
              onSortOrderChange={setSortOrder}
              onClearFilters={clearFilters}
            />
          </MotionSectionFrame>
          <MotionSectionFrame index={2}>
            <NotesResults
              notes={notes}
              loading={loading}
              error={error}
              pinnedCount={pinnedCount}
              totalCount={totalCount}
              onNoteChanged={handleNoteChanged}
              onNoteDeleted={handleNoteDeleted}
            />
            {!loading && !error && notes.length > 0 && (
              <Pagination
                page={page}
                pageSize={pageSize}
                itemCount={notes.length}
                totalCount={totalCount}
                onPageChange={setPage}
                className="mt-6"
              />
            )}
          </MotionSectionFrame>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
