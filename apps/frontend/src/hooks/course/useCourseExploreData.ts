import { useEffect, useState } from 'react';
import { courseAPI, type Course } from '../../services/api';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface UseCourseExploreDataParams {
  showToast: (message: string, type: ToastType) => void;
  page: number;
  pageSize: number;
  level: string;
  sort: string;
}

export function useCourseExploreData({ showToast, page, pageSize, level, sort }: UseCourseExploreDataParams) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchCourses = async () => {
      try {
        setLoading(true);
        const result = await courseAPI.getAllCourses(pageSize, (page - 1) * pageSize, false, { level, sort });
        if (!active) return;
        setCourses(result.data);
        setTotalCount(result.total_count ?? result.count);
      } catch (error) {
        if (!active) return;
        showToast(error instanceof Error ? error.message : 'Failed to load courses', 'error');
        setCourses([]);
        setTotalCount(0);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchCourses();
    return () => {
      active = false;
    };
  }, [level, page, pageSize, showToast, sort]);

  return { courses, totalCount, loading };
}
