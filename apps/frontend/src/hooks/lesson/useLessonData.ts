import { useEffect, useMemo, useState } from 'react';
import { enrollmentAPI, type Lesson as LessonData } from '../../services/api';
import type { LessonItem } from '../../components/lesson';

const canAccessLesson = (lesson?: LessonData) => Boolean(lesson && lesson.is_accessible !== false && !lesson.is_locked);

export function useLessonData({ courseId, lessonId }: { courseId?: string; lessonId?: string }) {
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [courseName, setCourseName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;

    let active = true;

    const fetchCourseLessons = async () => {
      try {
        setLoading(true);
        const result = await enrollmentAPI.getEnrolledCourseDetail(parseInt(courseId));
        if (!active) return;
        setLessons(result.data.lessons || []);
        setCourseName(result.data.title || '');
      } catch {
        if (active) {
          setLessons([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchCourseLessons();

    return () => {
      active = false;
    };
  }, [courseId]);

  const firstUnfinishedIndex = useMemo(() => lessons.findIndex((lesson) => !lesson.is_completed), [lessons]);
  const firstAccessibleIndex = useMemo(() => lessons.findIndex(canAccessLesson), [lessons]);

  const currentLessonIndex = useMemo(() => {
    const currentId = Number(lessonId);
    const paramIndex = lessons.findIndex((lesson) => lesson.lesson_id === currentId);
    if (paramIndex >= 0 && canAccessLesson(lessons[paramIndex])) return paramIndex;
    if (firstUnfinishedIndex >= 0 && canAccessLesson(lessons[firstUnfinishedIndex])) return firstUnfinishedIndex;
    return firstAccessibleIndex >= 0 ? firstAccessibleIndex : -1;
  }, [lessonId, lessons, firstUnfinishedIndex, firstAccessibleIndex]);

  const currentLesson = currentLessonIndex >= 0 ? lessons[currentLessonIndex] : undefined;

  const lessonItems: LessonItem[] = lessons.map((lesson, index) => ({
    id: lesson.lesson_id,
    title: lesson.title,
    status:
      index === currentLessonIndex
        ? 'current'
        : lesson.is_completed
          ? 'completed'
          : canAccessLesson(lesson) && index === firstUnfinishedIndex
            ? 'unlocked'
            : 'locked',
  }));

  const hasNextLesson = currentLessonIndex >= 0 && currentLessonIndex + 1 < lessons.length;
  const progressPercent = lessons.length > 0 && currentLessonIndex >= 0 ? Math.round(((currentLessonIndex + 1) / lessons.length) * 100) : 0;

  return {
    lessons,
    setLessons,
    courseName,
    loading,
    firstUnfinishedIndex,
    currentLessonIndex,
    currentLesson,
    lessonItems,
    hasNextLesson,
    progressPercent,
  };
}
