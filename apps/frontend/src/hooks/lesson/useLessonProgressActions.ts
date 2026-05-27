import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { enrollmentAPI, type Lesson as LessonData } from '../../services/api';

type LessonActionLoading = 'complete' | 'next' | null;

export function useLessonProgressActions({
  courseId,
  currentLesson,
  currentLessonIndex,
  lessons,
  setLessons,
  navigate,
}: {
  courseId?: string;
  currentLesson?: LessonData;
  currentLessonIndex: number;
  lessons: LessonData[];
  setLessons: Dispatch<SetStateAction<LessonData[]>>;
  navigate: NavigateFunction;
}) {
  const [actionLoading, setActionLoading] = useState<LessonActionLoading>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId || !currentLesson || currentLesson.is_completed) {
      return;
    }

    let active = true;
    const startLessonProgress = async () => {
      try {
        await enrollmentAPI.markLessonStarted(parseInt(courseId), currentLesson.lesson_id);
      } catch (error) {
        if (active) {
          console.warn(error instanceof Error ? error.message : 'Failed to start lesson progress');
        }
      }
    };

    startLessonProgress();

    return () => {
      active = false;
    };
  }, [courseId, currentLesson]);

  const handleMarkCompleted = useCallback(async () => {
    if (!courseId || !currentLesson || actionLoading) {
      return;
    }

    try {
      setActionLoading('complete');
      setActionError(null);
      const result = await enrollmentAPI.markLessonCompleted(parseInt(courseId), currentLesson.lesson_id);
      if (!result.data.completed) {
        throw new Error('Failed to mark lesson as completed');
      }
      setLessons((previousLessons) =>
        previousLessons.map((lesson) =>
          lesson.lesson_id === currentLesson.lesson_id
            ? {
                ...lesson,
                is_completed: true,
              }
            : lesson
        )
      );
      if (result.data.final_quiz) {
        navigate(`/courses/${courseId}/final-test`);
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to mark lesson as completed');
    } finally {
      setActionLoading(null);
    }
  }, [actionLoading, courseId, currentLesson, navigate, setLessons]);

  const handleNextLesson = useCallback(async () => {
    if (!courseId || !currentLesson?.is_completed || actionLoading) {
      return;
    }

    try {
      setActionLoading('next');
      if (currentLessonIndex >= 0 && currentLessonIndex + 1 < lessons.length) {
        const nextLesson = lessons[currentLessonIndex + 1];
        navigate(`/courses/${courseId}/lessons/${nextLesson.lesson_id}`);
        requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }));
      } else {
        const result = await enrollmentAPI.getNextLesson(parseInt(courseId));
        navigate(`/courses/${courseId}/lessons/${result.data.lesson_id}`);
        requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }));
      }
    } finally {
      setActionLoading(null);
    }
  }, [actionLoading, courseId, currentLesson?.is_completed, navigate, currentLessonIndex, lessons]);

  return {
    actionLoading,
    actionError,
    handleMarkCompleted,
    handleNextLesson,
  };
}
