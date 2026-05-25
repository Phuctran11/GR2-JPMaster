import type { Course } from '../../services/api';

export const DEFAULT_COURSE_LEVEL = 'all';
export const DEFAULT_COURSE_SORT = 'newest';

export interface CourseExploreFilters {
  level: string;
  sort: string;
}

export const formatCourseLevelLabel = (level: string) =>
  level.charAt(0).toUpperCase() + level.slice(1);

export const formatCourseSortLabel = (sort: string) => {
  if (sort === 'price-low') return 'Low Price';
  if (sort === 'price-high') return 'High Price';
  if (sort === 'free') return 'Free';
  return sort;
};

export const getCourseEnrollmentCount = (course: Course) => course.enroll_count ?? 0;

export const sortExploreCourses = (courses: Course[], topCourse?: Course) =>
  [...courses].sort((a, b) => {
    if (topCourse && a.course_id === topCourse.course_id) return -1;
    if (topCourse && b.course_id === topCourse.course_id) return 1;

    const enrollDiff = getCourseEnrollmentCount(b) - getCourseEnrollmentCount(a);
    if (enrollDiff !== 0) return enrollDiff;

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

export const filterAndSortExploreCourses = (courses: Course[], filters: CourseExploreFilters) => {
  let result = [...courses];

  if (filters.level !== DEFAULT_COURSE_LEVEL) {
    result = result.filter((course) => {
      const courseLevel = course.level?.toLowerCase() || '';
      return courseLevel === filters.level;
    });
  }

  if (filters.sort === 'free') {
    result = result.filter((course) => course.is_free);
  }

  result.sort((a, b) => {
    switch (filters.sort) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'free':
      case DEFAULT_COURSE_SORT:
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  return result;
};
