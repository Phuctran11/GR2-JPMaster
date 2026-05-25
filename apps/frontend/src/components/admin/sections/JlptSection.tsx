import type { Dispatch, SetStateAction } from 'react';
import { Pagination } from '../../Pagination';
import type { AdminJlptExam, AdminSortOrder } from '../../../services/api';
import { dangerButtonClass, inputClass, secondaryButtonClass } from '../adminClasses';
import { sortOrderOptions } from '../adminOptions';
import { AdminTable, SectionToolbar } from '../DashboardUi';

type JlptFilter = { search: string; sort_order: AdminSortOrder; limit: number; offset: number };

export function JlptSection({
  exams,
  totalCount,
  busy,
  filter,
  setFilter,
  onCreate,
  onEdit,
  onManageSections,
  onDelete,
}: {
  exams: AdminJlptExam[];
  totalCount: number;
  busy: boolean;
  filter: JlptFilter;
  setFilter: Dispatch<SetStateAction<JlptFilter>>;
  onCreate: () => void;
  onEdit: (item: AdminJlptExam) => void;
  onManageSections: (examId: number) => void;
  onDelete: (item: AdminJlptExam) => void;
}) {
  const pageSize = filter.limit ?? 10;
  const page = Math.floor((filter.offset ?? 0) / pageSize) + 1;
  const setPage = (nextPage: number) => setFilter({ ...filter, offset: (nextPage - 1) * pageSize });

  return (
    <section className="space-y-4">
      <SectionToolbar title="JLPT Tests" actionLabel="New JLPT Test" onAction={onCreate}>
        <input className={inputClass} placeholder="Search JLPT tests" value={filter.search} onChange={(e) => setFilter({ ...filter, search: e.target.value, offset: 0 })} />
        <select className={inputClass} value={filter.sort_order} onChange={(e) => setFilter({ ...filter, sort_order: e.target.value as AdminSortOrder, offset: 0 })}>
          {sortOrderOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </SectionToolbar>
      <AdminTable
        headers={['ID', 'Title', 'Level', 'Year', 'Sections', 'Questions', 'Actions']}
        rows={exams.map((exam) => [
          exam.exam_id,
          exam.title,
          exam.jlpt_level,
          exam.year || '-',
          exam.section_count || 0,
          exam.question_count || 0,
          <div className="flex flex-wrap gap-2">
            <button className={secondaryButtonClass} onClick={() => onEdit(exam)}>Edit</button>
            <button className={secondaryButtonClass} onClick={() => onManageSections(exam.exam_id)}>
              <span className="material-symbols-outlined text-[18px]">view_list</span>
              Sections
            </button>
            <button className={dangerButtonClass} disabled={busy} onClick={() => onDelete(exam)}>
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>,
        ])}
      />
      <Pagination page={page} pageSize={pageSize} itemCount={exams.length} totalCount={totalCount} onPageChange={setPage} />
    </section>
  );
}
