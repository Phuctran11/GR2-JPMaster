import { useState, type Dispatch, type SetStateAction } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { enrollmentAPI, paymentAPI, type Course, type PaymentTransaction } from '../../services/api';
import type { User } from '../../contexts/AuthContext';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface UseCourseEnrollmentActionsParams {
  courseId?: string;
  course: Course | null;
  user: User | null;
  firstUnfinishedLessonIndex: number;
  navigate: NavigateFunction;
  showToast: (message: string, type: ToastType) => void;
  setPaymentTransaction: Dispatch<SetStateAction<PaymentTransaction | null>>;
  setPaymentModalOpen: Dispatch<SetStateAction<boolean>>;
}

export function useCourseEnrollmentActions({
  courseId,
  course,
  user,
  firstUnfinishedLessonIndex,
  navigate,
  showToast,
  setPaymentTransaction,
  setPaymentModalOpen,
}: UseCourseEnrollmentActionsParams) {
  const [enrolling, setEnrolling] = useState(false);

  const handleEnroll = async () => {
    if (!user) {
      showToast('Please log in to enroll', 'error');
      navigate('/login');
      return;
    }

    if (!courseId || !course) return;

    try {
      setEnrolling(true);
      if (Number(course.price) > 0) {
        const payment = await paymentAPI.createPayOsCoursePayment(parseInt(courseId));
        if (payment.data.payment_required && payment.data.transaction) {
          setPaymentTransaction(payment.data.transaction);
          setPaymentModalOpen(true);
          showToast('Scan the payOS QR code to complete payment', 'info');
          return;
        }
      } else {
        await enrollmentAPI.enrollCourse(parseInt(courseId));
        showToast('Successfully enrolled in course!', 'success');
        navigate('/courses');
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to enroll', 'error');
    } finally {
      setEnrolling(false);
    }
  };

  const handleGetStarted = async () => {
    if (!courseId) return;

    try {
      setEnrolling(true);
      if (firstUnfinishedLessonIndex === -1 && course?.lessons?.length) {
        const lastLesson = course.lessons[course.lessons.length - 1];
        navigate(`/courses/${courseId}/lessons/${lastLesson.lesson_id}`);
        return;
      }

      const lessonResult = await enrollmentAPI.getNextLesson(parseInt(courseId));
      navigate(`/courses/${courseId}/lessons/${lessonResult.data.lesson_id}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to load lesson', 'error');
    } finally {
      setEnrolling(false);
    }
  };

  const handleViewCertificate = () => {
    if (!courseId) return;
    navigate(`/courses/${courseId}/certificate`);
  };

  const handleTakeFinalTest = () => {
    if (!courseId) return;
    navigate(`/courses/${courseId}/final-test`);
  };

  return {
    enrolling,
    handleEnroll,
    handleGetStarted,
    handleViewCertificate,
    handleTakeFinalTest,
  };
}
