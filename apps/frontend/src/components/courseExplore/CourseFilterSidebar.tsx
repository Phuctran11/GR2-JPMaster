import { Card, Select } from '../';
import {
  DEFAULT_COURSE_LEVEL,
  DEFAULT_COURSE_SORT,
  formatCourseLevelLabel,
  formatCourseSortLabel,
} from './courseExploreUtils';

interface CourseFilterSidebarProps {
  level: string;
  sort: string;
  onLevelChange: (value: string) => void;
  onSortChange: (value: string) => void;
}

export function CourseFilterSidebar({ level, sort, onLevelChange, onSortChange }: CourseFilterSidebarProps) {
  return (
    <Card className="border border-outline-variant bg-surface p-5">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-md">
          <h3 className="text-headline-sm font-bold text-on-surface flex items-center gap-2">
          <span className="w-1.5 h-6 bg-gradient-to-b from-primary to-secondary rounded-full"></span>
          Filter Courses
          </h3>
          <p className="text-label-md text-on-surface-variant mt-2">
            Narrow results by JLPT level, access type, price, or newest courses.
          </p>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block text-label-md font-bold text-on-surface uppercase mb-2">Level</label>
          <Select
            options={[
              { value: DEFAULT_COURSE_LEVEL, label: 'All Levels' },
              { value: 'beginner', label: 'Beginner (N5-N4)' },
              { value: 'intermediate', label: 'Intermediate (N3-N2)' },
              { value: 'advanced', label: 'Advanced (N1)' },
            ]}
            value={level}
            onChange={(e) => onLevelChange(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-label-md font-bold text-on-surface uppercase mb-2">Sort</label>
          <Select
            options={[
              { value: DEFAULT_COURSE_SORT, label: 'Newest' },
              { value: 'free', label: 'Free Courses' },
              { value: 'price-low', label: 'Price: Low to High' },
              { value: 'price-high', label: 'Price: High to Low' },
            ]}
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
          />
        </div>
        </div>
      </div>

      {(level !== DEFAULT_COURSE_LEVEL || sort !== DEFAULT_COURSE_SORT) && (
        <div className="mt-5 pt-4 border-t border-outline-variant flex flex-wrap gap-2">
          {level !== DEFAULT_COURSE_LEVEL && (
            <span className="inline-flex items-center gap-2 px-3 py-2 bg-primary-fixed text-on-primary-fixed rounded-full text-label-sm font-semibold">
              Level: {formatCourseLevelLabel(level)}
              <button
                onClick={() => onLevelChange(DEFAULT_COURSE_LEVEL)}
                className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full hover:bg-on-primary-fixed/20 transition-colors duration-200"
                title="Remove level filter"
              >
                <span className="material-symbols-outlined text-[15px] leading-none">close</span>
              </button>
            </span>
          )}
          {sort !== DEFAULT_COURSE_SORT && (
            <span className="inline-flex items-center gap-2 px-3 py-2 bg-secondary-fixed text-on-secondary-fixed rounded-full text-label-sm font-semibold">
              Sort: {formatCourseSortLabel(sort)}
              <button
                onClick={() => onSortChange(DEFAULT_COURSE_SORT)}
                className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full hover:bg-on-secondary-fixed/20 transition-colors duration-200"
                title="Remove sort filter"
              >
                <span className="material-symbols-outlined text-[15px] leading-none">close</span>
              </button>
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
