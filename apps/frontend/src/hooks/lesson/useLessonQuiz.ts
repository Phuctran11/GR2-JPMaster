import { useEffect, useState } from 'react';
import { quizAPI, type Lesson as LessonData, type Quiz } from '../../services/api';

export function useLessonQuiz({ courseId, currentLesson }: { courseId?: string; currentLesson?: LessonData }) {
  const [lessonQuiz, setLessonQuiz] = useState<Quiz | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);

  useEffect(() => {
    if (!courseId || !currentLesson) {
      setLessonQuiz(null);
      return;
    }

    let active = true;
    const fetchQuizzes = async () => {
      try {
        setQuizLoading(true);
        const lessonQuizResult = await quizAPI.getLessonQuiz(currentLesson.lesson_id);

        if (!active) return;
        setLessonQuiz(lessonQuizResult.data);
      } catch {
        if (active) {
          setLessonQuiz(null);
        }
      } finally {
        if (active) {
          setQuizLoading(false);
        }
      }
    };

    fetchQuizzes();

    return () => {
      active = false;
    };
  }, [courseId, currentLesson]);

  return {
    lessonQuiz,
    quizLoading,
    lessonQuizPassed: !lessonQuiz || Boolean(lessonQuiz.has_passed || lessonQuiz.latest_attempt?.passed),
  };
}
