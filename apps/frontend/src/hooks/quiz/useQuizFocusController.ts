import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { enrollmentAPI, quizAPI, type Quiz, type QuizAttemptSummary, type QuizSubmitResult } from '../../services/api';
import { getQuizDurationSeconds } from '../../components/quiz/quizFocusUtils';
import { useQuizFocusAudio } from './useQuizFocusAudio';
import { useQuizFocusGuard } from './useQuizFocusGuard';

export function useQuizFocusController({
  courseId,
  lessonId,
}: {
  courseId?: string;
  lessonId?: string;
}) {
  const navigate = useNavigate();
  const isFinalTest = !lessonId;
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempt, setAttempt] = useState<QuizAttemptSummary | null>(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [submitSignal, setSubmitSignal] = useState(0);
  const [submittedResult, setSubmittedResult] = useState<QuizSubmitResult | null>(null);
  const [readyToStart, setReadyToStart] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const timeUpChimePlayedRef = useRef(false);
  const { unlockAudio, playTimeUpChime } = useQuizFocusAudio();

  const durationSeconds = useMemo(
    () => getQuizDurationSeconds(quiz?.time_limit_minutes),
    [quiz?.time_limit_minutes]
  );

  useEffect(() => {
    if (!courseId) return;
    if (isFinalTest && !readyToStart) return;

    let active = true;
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        setError(null);
        const [courseResult, quizResult] = await Promise.all([
          enrollmentAPI.getEnrolledCourseDetail(parseInt(courseId)),
          isFinalTest
            ? quizAPI.getFinalQuiz(parseInt(courseId))
            : lessonId
              ? quizAPI.getLessonQuiz(parseInt(lessonId))
              : Promise.resolve({ data: null }),
        ]);

        if (!active) return;
        setCourseTitle(courseResult.data.title);

        if (!quizResult.data) {
          setQuiz(null);
          setError(isFinalTest ? 'Final test is not available for this course.' : 'Quiz is not available for this lesson.');
          return;
        }

        setQuiz(quizResult.data);
        setRemainingSeconds(getQuizDurationSeconds(quizResult.data.time_limit_minutes));
        const attemptResult = await quizAPI.startQuiz(quizResult.data.quiz_id);
        if (!active) return;
        setAttempt(attemptResult.data);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load quiz');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void fetchQuiz();

    return () => {
      active = false;
    };
  }, [courseId, isFinalTest, lessonId, readyToStart]);

  useEffect(() => {
    if (loading || !quiz || submittedResult) return;

    const intervalId = window.setInterval(() => {
      setRemainingSeconds((previous) => {
        if (previous <= 1) {
          window.clearInterval(intervalId);
          setTimedOut(true);
          if (!timeUpChimePlayedRef.current) {
            timeUpChimePlayedRef.current = true;
            playTimeUpChime();
          }
          setSubmitSignal((value) => value + 1);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [loading, playTimeUpChime, quiz, submittedResult]);

  useQuizFocusGuard({ enabled: !submittedResult });

  const startFinalTest = () => {
    unlockAudio();
    setReadyToStart(true);
  };

  const handleSubmitted = useCallback((result: QuizSubmitResult) => {
    setSubmittedResult(result);
  }, []);

  const handleRetake = () => {
    setAttempt(null);
    setSubmittedResult(null);
    setRemainingSeconds(durationSeconds);
    setSubmitSignal(0);
    setTimedOut(false);
    timeUpChimePlayedRef.current = false;
    if (!quiz) return;
    quizAPI.startQuiz(quiz.quiz_id).then((result) => setAttempt(result.data)).catch((startError) => {
      setError(startError instanceof Error ? startError.message : 'Failed to start quiz');
    });
  };

  const handleExit = () => {
    if (!courseId) {
      navigate('/courses');
      return;
    }

    if (isFinalTest) {
      const finalRequirementSatisfied = Boolean(quiz?.has_passed || submittedResult?.passed);
      navigate(finalRequirementSatisfied ? `/courses/${courseId}/certificate` : `/courses/${courseId}`);
      return;
    }

    navigate(lessonId ? `/courses/${courseId}/lessons/${lessonId}` : `/courses/${courseId}`);
  };

  return {
    isFinalTest,
    quiz,
    attempt,
    courseTitle,
    loading,
    error,
    remainingSeconds,
    submitSignal,
    submittedResult,
    readyToStart,
    timedOut,
    startFinalTest,
    handleSubmitted,
    handleRetake,
    handleExit,
  };
}
