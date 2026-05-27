import type { Dispatch, SetStateAction } from 'react';
import { Pagination } from '../../Pagination';
import type { AdminCourse, AdminSortOrder } from '../../../services/api';
import { actionButtonClass, dangerButtonClass, inputClass, secondaryButtonClass } from '../adminClasses';
import { optionLabel } from '../adminHelpers';
import { courseLevelOptions, sortOrderOptions } from '../adminOptions';
import { AdminTable, SectionToolbar } from '../DashboardUi';

type CourseFilter = { search: string; level: string; sort_order: AdminSortOrder; limit: number; offset: number };

export function CoursesSection({
  courses,
  totalCount,
  busy,
  filter,
  setFilter,
  onCreateCourse,
  onEditCourse,
  onManageLessons,
  onCreateLesson,
  onDeleteCourse,
}: {
  courses: AdminCourse[];
  totalCount: number;
  busy: boolean;
  filter: CourseFilter;
  setFilter: Dispatch<SetStateAction<CourseFilter>>;
  onCreateCourse: () => void;
  onEditCourse: (item: AdminCourse) => void;
  onManageLessons: (courseId: number) => void;
  onCreateLesson: (courseId?: number | null) => void;
  onDeleteCourse: (item: AdminCourse) => void;
}) {
  const pageSize = filter.limit ?? 10;
  const page = Math.floor((filter.offset ?? 0) / pageSize) + 1;
  const setPage = (nextPage: number) => setFilter({ ...filter, offset: (nextPage - 1) * pageSize });

  return (
    <section className="space-y-4">
      <SectionToolbar title="Courses & Lessons" actionLabel="New Course" onAction={onCreateCourse}>
        <input className={inputClass} placeholder="Search courses" value={filter.search} onChange={(e) => setFilter({ ...filter, search: e.target.value, offset: 0 })} />
        <select className={inputClass} value={filter.level} onChange={(e) => setFilter({ ...filter, level: e.target.value, offset: 0 })}>
          <option value="">All levels</option>
          {courseLevelOptions.map((option) => (
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
        headers={['ID', 'Title', 'Level', 'Price', 'Lessons', 'Actions']}
        rows={courses.map((item) => [
          item.course_id,
          item.title,
          optionLabel(courseLevelOptions, item.level),
          Number(item.price).toLocaleString('en-US'),
          item.lesson_count || 0,
          <div className="flex flex-wrap gap-2">
            <button className={secondaryButtonClass} onClick={() => onEditCourse(item)}>Edit</button>
            <button className={secondaryButtonClass} onClick={() => onManageLessons(item.course_id)}>Manage Lessons</button>
            <button className={actionButtonClass} onClick={() => onCreateLesson(item.course_id)}>
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Lesson
            </button>
            <button className={dangerButtonClass} onClick={() => onDeleteCourse(item)} disabled={busy}>
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>,
        ])}
      />
      <Pagination page={page} pageSize={pageSize} itemCount={courses.length} totalCount={totalCount} onPageChange={setPage} />
    </section>
  );
}
