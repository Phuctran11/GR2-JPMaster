import type { Dispatch, SetStateAction } from 'react';
import { Pagination } from '../../Pagination';
import type { AdminBlog, AdminBlogStatus, AdminSortOrder } from '../../../services/api';
import { dangerButtonClass, inputClass, secondaryButtonClass } from '../adminClasses';
import { sortOrderOptions } from '../adminOptions';
import { AdminTable, SectionToolbar } from '../DashboardUi';

type BlogFilter = { search: string; status: AdminBlogStatus | 'all'; sort_order: AdminSortOrder; limit: number; offset: number };

export function BlogsSection({
  blogs,
  totalCount,
  busy,
  filter,
  setFilter,
  onCreate,
  onEdit,
  onDelete,
}: {
  blogs: AdminBlog[];
  totalCount: number;
  busy: boolean;
  filter: BlogFilter;
  setFilter: Dispatch<SetStateAction<BlogFilter>>;
  onCreate: () => void;
  onEdit: (item: AdminBlog) => void;
  onDelete: (item: AdminBlog) => void;
}) {
  const pageSize = filter.limit ?? 10;
  const page = Math.floor((filter.offset ?? 0) / pageSize) + 1;
  const setPage = (nextPage: number) => setFilter({ ...filter, offset: (nextPage - 1) * pageSize });

  return (
    <section className="space-y-4">
      <SectionToolbar title="Blogs" actionLabel="New Blog" onAction={onCreate}>
        <input className={inputClass} placeholder="Search blogs" value={filter.search} onChange={(e) => setFilter({ ...filter, search: e.target.value, offset: 0 })} />
        <select className={inputClass} value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value as AdminBlogStatus | 'all', offset: 0 })}>
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <select className={inputClass} value={filter.sort_order} onChange={(e) => setFilter({ ...filter, sort_order: e.target.value as AdminSortOrder, offset: 0 })}>
          {sortOrderOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </SectionToolbar>
      <AdminTable
        headers={['ID', 'Title', 'Category', 'Status', 'Author', 'Slug', 'Actions']}
        rows={blogs.map((item) => [
          item.blog_id,
          item.title,
          item.category || '-',
          item.status,
          item.author_username || item.author_id,
          item.slug,
          <div className="flex flex-wrap gap-2">
            <button className={secondaryButtonClass} onClick={() => onEdit(item)}>Edit</button>
            <button className={dangerButtonClass} disabled={busy} onClick={() => onDelete(item)}>
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>,
        ])}
      />
      <Pagination page={page} pageSize={pageSize} itemCount={blogs.length} totalCount={totalCount} onPageChange={setPage} />
    </section>
  );
}
