import { useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Header, Footer, Breadcrumbs } from '../components';
import {
  CourseContentSection,
  CourseHeroSection,
  CoursePaymentModal,
  CourseRatingSection,
  CourseReviewsSection,
} from '../components/course';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useCourseDetailData } from '../hooks/course/useCourseDetailData';
import { useCourseEnrollmentActions } from '../hooks/course/useCourseEnrollmentActions';
import { useCoursePayment } from '../hooks/course/useCoursePayment';

export default function CourseDetail() {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { addToast } = useToast();
  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' | 'warning') => addToast(message, type),
    [addToast]
  );

  const {
    course,
    loading,
    enrollmentStatus,
    setEnrollmentStatus,
    userRating,
    setUserRating,
    finalQuiz,
    fetchReviews,
    orderedReviews,
    averageRating,
    firstUnfinishedLessonIndex,
    effectiveEnrollmentStatus,
    allLessonsCompleted,
    finalQuizPassed,
    shouldShowFinalTestButton,
    modules,
  } = useCourseDetailData({ courseId, user, showToast });
  const {
    paymentTransaction,
    setPaymentTransaction,
    paymentModalOpen,
    setPaymentModalOpen,
    checkingPayment,
    payOsEmbeddedError,
    refreshPaymentStatus,
  } = useCoursePayment({
    navigate,
    showToast,
    onPaymentCompleted: () => setEnrollmentStatus('active'),
  });
  const {
    enrolling,
    handleEnroll,
    handleGetStarted,
    handleViewCertificate,
    handleTakeFinalTest,
  } = useCourseEnrollmentActions({
    courseId,
    course,
    user,
    firstUnfinishedLessonIndex,
    navigate,
    showToast,
    setPaymentTransaction,
    setPaymentModalOpen,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-on-surface-variant">Loading course details...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!course || !courseId) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-on-surface-variant">Course not found</p>
        </main>
        <Footer />
      </div>
    );
  }

  const origin = (location.state as any)?.from;
  const targetRatingId = Number((location.state as any)?.targetRatingId) || undefined;
  const breadcrumbs = [
    { label: 'Home', path: '/' },
    {
      label: origin === '/courses'
        ? 'My Learning'
        : origin === '/explore'
          ? 'Explore Courses'
          : effectiveEnrollmentStatus
            ? 'My Learning'
            : 'Explore Courses',
      path: origin === '/courses'
        ? '/courses'
        : origin === '/explore'
          ? '/explore'
          : effectiveEnrollmentStatus
            ? '/courses'
            : '/explore',
    },
    { label: course.title },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <Breadcrumbs items={breadcrumbs} />
      <main className="flex-1">
        <CourseHeroSection
          course={course}
          enrollmentStatus={enrollmentStatus}
          effectiveEnrollmentStatus={effectiveEnrollmentStatus}
          enrolling={enrolling}
          shouldShowFinalTestButton={Boolean(shouldShowFinalTestButton)}
          onEnroll={handleEnroll}
          onGetStarted={handleGetStarted}
          onTakeFinalTest={handleTakeFinalTest}
          onViewCertificate={handleViewCertificate}
        />
        <CourseContentSection
          course={course}
          modules={modules}
          firstUnfinishedLessonIndex={firstUnfinishedLessonIndex}
          finalQuiz={finalQuiz}
          enrollmentStatus={enrollmentStatus}
          shouldShowFinalTestButton={Boolean(shouldShowFinalTestButton)}
          finalQuizPassed={finalQuizPassed}
          allLessonsCompleted={allLessonsCompleted}
          onSelectLesson={(lessonId) => navigate(`/courses/${courseId}/lessons/${lessonId}`)}
          onTakeFinalTest={handleTakeFinalTest}
        />
        {enrollmentStatus && user && (
          <CourseRatingSection
            courseId={parseInt(courseId)}
            userRating={userRating}
            loading={loading}
            onSuccess={(newRating) => {
              setUserRating(newRating || null);
              showToast('Your review has been submitted successfully!', 'success');
              fetchReviews();
            }}
            onError={(error) => showToast(error, 'error')}
          />
        )}
        <CourseReviewsSection
          orderedReviews={orderedReviews}
          averageRating={averageRating}
          user={user}
          highlightedRatingId={targetRatingId}
        />
      </main>
      {paymentModalOpen && paymentTransaction && (
        <CoursePaymentModal
          courseTitle={course.title}
          transaction={paymentTransaction}
          checkingPayment={checkingPayment}
          embeddedError={payOsEmbeddedError}
          onRefreshStatus={refreshPaymentStatus}
          onClose={() => setPaymentModalOpen(false)}
        />
      )}
      <Footer />
    </div>
  );
}
