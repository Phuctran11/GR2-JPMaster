type PaginationProps = {
  page: number;
  pageSize: number;
  itemCount: number;
  onPageChange: (page: number) => void;
  totalCount?: number;
  className?: string;
};

export function Pagination({ page, pageSize, itemCount, onPageChange, totalCount, className = '' }: PaginationProps) {
  const hasPrevious = page > 1;
  const hasNext = typeof totalCount === 'number' ? page * pageSize < totalCount : itemCount >= pageSize;
  const start = itemCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = (page - 1) * pageSize + itemCount;

  if (page === 1 && itemCount < pageSize && !totalCount) return null;

  return (
    <nav className={`flex flex-col gap-3 rounded-xl border border-outline-variant bg-surface p-3 sm:flex-row sm:items-center sm:justify-between ${className}`} aria-label="Pagination">
      <p className="text-label-md text-on-surface-variant">
        Showing <span className="font-bold text-on-surface">{start}</span>
        {' - '}
        <span className="font-bold text-on-surface">{end}</span>
        {typeof totalCount === 'number' ? (
          <>
            {' '}of <span className="font-bold text-on-surface">{totalCount}</span>
          </>
        ) : null}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!hasPrevious}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface px-3 text-label-md font-semibold text-on-surface transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-45"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          Prev
        </button>
        <span className="min-h-10 rounded-lg bg-primary/10 px-3 py-2 text-label-md font-bold text-primary">Page {page}</span>
        <button
          type="button"
          disabled={!hasNext}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface px-3 text-label-md font-semibold text-on-surface transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-45"
        >
          Next
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>
    </nav>
  );
}
