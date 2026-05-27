import type { Dispatch, SetStateAction } from 'react';
import { Pagination } from '../../Pagination';
import type { AdminQuizType, AdminSortOrder, AdminTest } from '../../../services/api';
import { dangerButtonClass, inputClass, secondaryButtonClass } from '../adminClasses';
import { optionLabel } from '../adminHelpers';
import { quizTypeOptions, sortOrderOptions } from '../adminOptions';
import { AdminTable, SectionToolbar } from '../DashboardUi';

type TestFilter = { search: string; quiz_type: AdminQuizType | 'all'; sort_order: AdminSortOrder; limit: number; offset: number };

export function TestsSection({
  tests,
  totalCount,
  busy,
  filter,
  setFilter,
  onCreate,
  onEdit,
  onManageQuestions,
  onDelete,
}: {
  tests: AdminTest[];
  totalCount: number;
  busy: boolean;
  filter: TestFilter;
  setFilter: Dispatch<SetStateAction<TestFilter>>;
  onCreate: () => void;
  onEdit: (item: AdminTest) => void;
  onManageQuestions: (quizId: number) => void;
  onDelete: (item: AdminTest) => void;
}) {
  const pageSize = filter.limit ?? 10;
  const page = Math.floor((filter.offset ?? 0) / pageSize) + 1;
  const setPage = (nextPage: number) => setFilter({ ...filter, offset: (nextPage - 1) * pageSize });

  return (
    <section className="space-y-4">
      <SectionToolbar title="Quizzes" actionLabel="New Quiz" onAction={onCreate}>
        <input className={inputClass} placeholder="Search quizzes" value={filter.search} onChange={(e) => setFilter({ ...filter, search: e.target.value, offset: 0 })} />
        <select className={inputClass} value={filter.quiz_type} onChange={(e) => setFilter({ ...filter, quiz_type: e.target.value as AdminQuizType | 'all', offset: 0 })}>
          <option value="all">All types</option>
          {quizTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select className={inputClass} value={filter.sort_order} onChange={(e) => setFilter({ ...filter, sort_order: e.target.value as AdminSortOrder, offset: 0 })}>
          {sortOrderOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </SectionToolbar>
      <AdminTable
        headers={['ID', 'Title', 'Type', 'Course', 'Questions', 'Actions']}
        rows={tests.map((item) => [
          item.quiz_id,
          item.title,
          optionLabel(quizTypeOptions, item.quiz_type),
          item.course_title || item.course_id || '-',
          item.question_count || 0,
          <div className="flex flex-wrap gap-2">
            <button className={secondaryButtonClass} onClick={() => onEdit(item)}>Edit</button>
            <button className={secondaryButtonClass} onClick={() => onManageQuestions(item.quiz_id)}>
              <span className="material-symbols-outlined text-[18px]">quiz</span>
              Questions
            </button>
            <button className={dangerButtonClass} disabled={busy} onClick={() => onDelete(item)}>
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>,
        ])}
      />
      <Pagination page={page} pageSize={pageSize} itemCount={tests.length} totalCount={totalCount} onPageChange={setPage} />
    </section>
  );
}
