import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  courseAPI,
  enrollmentAPI,
  quizAPI,
  ratingAPI,
  type Course,
  type Quiz,
} from '../../services/api';
import type { User } from '../../contexts/AuthContext';
import type { CourseModule, ReviewCard } from '../../components/course';

export function useCourseDetailData({
  courseId,
  user,
  showToast,
}: {
  courseId?: string;
  user: User | null;
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}) {
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [reviews, setReviews] = useState<ReviewCard[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [enrollmentStatus, setEnrollmentStatus] = useState<'active' | 'completed' | 'dropped' | null>(null);
  const [userRating, setUserRating] = useState<ReviewCard | null>(null);
  const [finalQuiz, setFinalQuiz] = useState<Quiz | null>(null);

  const fetchReviews = useCallback(async () => {
    if (!courseId) return;
    try {
      const reviewsResult = await ratingAPI.getCourseRatings(parseInt(courseId), 50, 0);
      setReviews(reviewsResult.data);
      setAverageRating(reviewsResult.average_rating);

      if (user) {
        const userReview = reviewsResult.data.find((review) => review.user_id === user.user_id);
        setUserRating(userReview || null);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  }, [courseId, user]);

  useEffect(() => {
    if (!courseId) return;

    const fetchCourse = async () => {
      try {
        setLoading(true);
        const result = await courseAPI.getCourseById(parseInt(courseId));
        setCourse(result.data);

        await fetchReviews();

        setEnrollmentStatus(null);
        setFinalQuiz(null);

        if (user) {
          try {
            const enrollmentStatusResult = await enrollmentAPI.getCourseEnrollmentStatus(parseInt(courseId));
            if (!enrollmentStatusResult.data.enrolled) return;

            const enrolledCourseResult = await enrollmentAPI.getEnrolledCourseDetail(parseInt(courseId));
            const enrolledCourse = enrolledCourseResult.data;
            const status =
              enrolledCourse.enrollment_status === 'active' ||
              enrolledCourse.enrollment_status === 'completed' ||
              enrolledCourse.enrollment_status === 'dropped'
                ? enrolledCourse.enrollment_status
                : 'active';

            setEnrollmentStatus(status);
            setCourse((currentCourse) => currentCourse
              ? {
                ...currentCourse,
                ...enrolledCourse,
                lessons: enrolledCourse.lessons ?? currentCourse.lessons,
              }
              : enrolledCourse);

            const finalQuizResult = await quizAPI.getFinalQuiz(parseInt(courseId));
            setFinalQuiz(finalQuizResult.data);
          } catch {
            // Public course detail still renders for users who are not enrolled.
          }
        }
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Failed to load course', 'error');
        navigate('/courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, navigate, showToast, user, fetchReviews]);

  const orderedReviews = useMemo(() => {
    const source = userRating ? [userRating, ...reviews] : reviews;
    const uniqueReviews = Array.from(new Map(source.map((review) => [review.rating_id, review])).values());

    return uniqueReviews.sort((a, b) => {
      const aIsUserReview = Boolean(user && a.user_id === user.user_id);
      const bIsUserReview = Boolean(user && b.user_id === user.user_id);

      if (aIsUserReview !== bIsUserReview) {
        return aIsUserReview ? -1 : 1;
      }

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [reviews, user, userRating]);

  const firstUnfinishedLessonIndex = course?.lessons?.findIndex((lesson) => !lesson.is_completed) ?? -1;
  const effectiveEnrollmentStatus = enrollmentStatus;
  const allLessonsCompleted = Boolean(course?.lessons?.length) && firstUnfinishedLessonIndex === -1;
  const finalQuizPassed = Boolean(finalQuiz?.has_passed || finalQuiz?.latest_attempt?.passed);
  const shouldShowFinalTestButton = effectiveEnrollmentStatus === 'active' && allLessonsCompleted && finalQuiz && !finalQuizPassed;

  const modules: CourseModule[] = (course?.lessons || []).map((lesson, index) => ({
    id: index + 1,
    title: lesson.title,
    videos: 1,
  }));

  return {
    course,
    setCourse,
    reviews,
    averageRating,
    loading,
    enrollmentStatus,
    setEnrollmentStatus,
    userRating,
    setUserRating,
    finalQuiz,
    fetchReviews,
    orderedReviews,
    firstUnfinishedLessonIndex,
    effectiveEnrollmentStatus,
    allLessonsCompleted,
    finalQuizPassed,
    shouldShowFinalTestButton,
    modules,
  };
}
