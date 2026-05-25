import { useMemo, useState } from 'react';
import type { Course } from '../../services/api';
import {
  DEFAULT_COURSE_LEVEL,
  DEFAULT_COURSE_SORT,
  filterAndSortExploreCourses,
} from '../../components/courseExplore/courseExploreUtils';

export function useCourseExploreFilters(courses: Course[]) {
  const [level, setLevel] = useState(DEFAULT_COURSE_LEVEL);
  const [sort, setSort] = useState(DEFAULT_COURSE_SORT);

  const filteredCourses = useMemo(
    () => filterAndSortExploreCourses(courses, { level, sort }),
    [courses, level, sort],
  );

  return {
    filteredCourses,
    level,
    setLevel,
    sort,
    setSort,
  };
}
