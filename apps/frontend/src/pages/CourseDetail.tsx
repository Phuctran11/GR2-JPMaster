import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Header, Footer, Button, Card, Container, Breadcrumbs } from '../components';
import { ImageCard } from '../components/ui';
import { Heading, Text } from '../components/ui/Typography';
import { courseAPI, enrollmentAPI, paymentAPI, quizAPI, ratingAPI, type Course, type Lesson, type PaymentTransaction, type Quiz } from '../services/api';
import { RatingForm } from '../components/cards/RatingForm';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getCourseLessonCount } from '../utils/course';

declare global {
  interface Window {
    PayOSCheckout?: {
      usePayOS: (config: {
        RETURN_URL: string;
        ELEMENT_ID: string;
        CHECKOUT_URL: string;
        embedded: boolean;
        onSuccess?: (event: unknown) => void;
        onCancel?: (event: unknown) => void;
        onExit?: (event: unknown) => void;
      }) => {
        open: () => void;
        exit: () => void;
      };
    };
  }
}

interface CourseModule {
  id: number;
  title: string;
  videos: number;
}

function ModuleItem({
  module,
  lesson,
  onPlay,
  canPlay,
}: {
  module: CourseModule;
  lesson?: Lesson;
  onPlay?: () => void;
  canPlay: boolean;
}) {
  const isCompleted = Boolean(lesson?.is_completed);
  const isLocked = !isCompleted && !canPlay;

  return (
    <div
      className={`group p-stack-lg border transition-all flex justify-between items-center shadow-sm ${
        isCompleted
          ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-200 hover:border-emerald-400 hover:bg-emerald-100'
          : isLocked
            ? 'bg-surface-container-low border-outline-variant opacity-80'
          : 'bg-white border-outline-variant hover:border-primary'
      }`}
    >
      <div className="flex gap-stack-lg">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full border text-headline-sm font-bold transition-colors ${
            isCompleted
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200'
              : isLocked
                ? 'bg-surface-container text-on-surface-variant border-outline-variant'
              : 'bg-surface text-outline-variant border-outline-variant group-hover:border-primary group-hover:text-primary'
          }`}
        >
          {String(module.id).padStart(2, '0')}
        </div>
        <span
          className={`hidden font-headline-md transition-colors ${
            isCompleted ? 'text-emerald-700 group-hover:text-emerald-800' : 'text-outline-variant group-hover:text-primary'
          }`}
        >
          {String(module.id).padStart(2, '0')}
        </span>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-headline-sm ${isCompleted ? 'text-emerald-900' : 'text-on-surface'}`}>{module.title}</h3>
          </div>
          <div className={`flex items-center gap-4 text-label-md ${isCompleted ? 'text-emerald-700' : 'text-on-surface-variant'}`}>
            {lesson && (
              <>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">{lesson.video_url ? 'play_circle' : 'description'}</span>
                  {[lesson.video_url ? 'Video' : null, lesson.content_text ? 'Text' : null, lesson.audio_url ? 'Audio' : null].filter(Boolean).join(' + ') || 'Lesson'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  {formatLessonDuration(lesson.duration)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      {canPlay ? (
        <button
          type="button"
          onClick={onPlay}
          className={`px-4 py-2 font-label-md transition-all flex items-center gap-2 ${
            isCompleted
              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-200'
              : 'bg-surface-container hover:bg-primary-container hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">play_circle</span>
        </button>
      ) : (
        <div className="px-4 py-2 font-label-md flex items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px]">lock</span>
        </div>
      )}
    </div>
  );
}

interface ReviewCard {
  rating_id: number;
  user_id: number;
  username?: string;
  review: string | null;
  rating: number;
  created_at: string;
}

const formatCourseDuration = (durationMinutes?: number | null) => {
  if (durationMinutes == null || durationMinutes <= 0) {
    return 'Self-paced';
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours === 0) {
    return `${durationMinutes} min`;
  }

  const hourLabel = hours === 1 ? 'hr' : 'hrs';

  if (minutes === 0) {
    return `${hours} ${hourLabel}`;
  }

  return `${hours} ${hourLabel} ${minutes} min`;
};

const formatLessonDuration = (durationMinutes?: number | null) => {
  if (durationMinutes == null || durationMinutes <= 0) {
    return 'Self-paced';
  }

  return durationMinutes < 60 ? `${durationMinutes} min` : formatCourseDuration(durationMinutes);
};

const formatVnd = (amount: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);

function ReviewItem({ review, isUser }: { review: ReviewCard; isUser?: boolean }) {
  const getInitials = (username: string | undefined) => (username || 'U').substring(0, 2).toUpperCase();
  const colors = ['bg-primary-fixed', 'bg-secondary-fixed', 'bg-tertiary-fixed'];
  
  return (
    <Card className={`h-full relative p-6 border transition-all ${isUser ? 'bg-primary-fixed/20 border-primary shadow-lg shadow-primary/15 ring-2 ring-primary/25' : 'bg-white border-outline-variant'}`}>
      <div className="absolute -top-4 -left-4 text-primary opacity-10">
        <span className="material-symbols-outlined text-6xl">format_quote</span>
      </div>
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex text-secondary">
          {[...Array(5)].map((_, i) => (
            <span 
              key={i} 
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: i < review.rating ? "'FILL' 1" : "'FILL' 0" }}
            >
              star
            </span>
          ))}
        </div>
        {isUser && (
          <span className="bg-primary text-on-primary px-3 py-1 rounded-full text-label-sm font-bold">
            Your Review
          </span>
        )}
      </div>
      <p className="text-on-surface italic font-body-md mb-6 leading-relaxed min-h-[84px]">"{review.review || 'No review text provided'}"</p>
      <div className="flex items-center gap-3 mt-auto">
        <div className={`w-10 h-10 ${colors[review.user_id % colors.length]} rounded-full flex items-center justify-center font-bold text-xs`}>
          {getInitials(review.username)}
        </div>
        <div>
          <p className="text-label-md font-bold">{review.username || 'Anonymous'}</p>
          <p className="text-[12px] text-on-surface-variant">{new Date(review.created_at).toLocaleDateString()}</p>
        </div>
      </div>
    </Card>
  );
}

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
  
  const [course, setCourse] = useState<Course | null>(null);
  const [reviews, setReviews] = useState<ReviewCard[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState<'active' | 'completed' | 'dropped' | null>(null);
  const [userRating, setUserRating] = useState<ReviewCard | null>(null);
  const [finalQuiz, setFinalQuiz] = useState<Quiz | null>(null);
  const [paymentTransaction, setPaymentTransaction] = useState<PaymentTransaction | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [payOsEmbeddedError, setPayOsEmbeddedError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    if (!courseId) return;
    try {
      const reviewsResult = await ratingAPI.getCourseRatings(parseInt(courseId), 10, 0);
      setReviews(reviewsResult.data);
      setAverageRating(reviewsResult.average_rating);
      
      // Find user's rating if they have one
      if (user) {
        const userReview = reviewsResult.data.find(r => r.user_id === user.user_id);
        setUserRating(userReview || null);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  }, [courseId, user]);

  const orderedReviews = (() => {
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
  })();

  useEffect(() => {
    if (!courseId) return;

    const fetchCourse = async () => {
      try {
        setLoading(true);
        const result = await courseAPI.getCourseById(parseInt(courseId));
        setCourse(result.data);
        
        // Fetch reviews
        await fetchReviews();

        // Check if user is enrolled in this course
        if (user) {
          try {
            const enrollmentResult = await enrollmentAPI.getEnrolledCourseDetail(parseInt(courseId));
            setCourse(enrollmentResult.data);
            setEnrollmentStatus(enrollmentResult.data.enrollment_status as 'active' | 'completed' | 'dropped');
            const finalQuizResult = await quizAPI.getFinalQuiz(parseInt(courseId));
            setFinalQuiz(finalQuizResult.data);
          } catch (error) {
            // User is not enrolled (404 or error)
            setEnrollmentStatus(null);
            setFinalQuiz(null);
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

  const firstUnfinishedLessonIndex = course?.lessons?.findIndex((lesson) => !lesson.is_completed) ?? -1;
  const effectiveEnrollmentStatus = enrollmentStatus;
  const allLessonsCompleted = Boolean(course?.lessons?.length) && firstUnfinishedLessonIndex === -1;
  const finalQuizPassed = Boolean(finalQuiz?.has_passed || finalQuiz?.latest_attempt?.passed);
  const shouldShowFinalTestButton = effectiveEnrollmentStatus === 'active' && allLessonsCompleted && finalQuiz && !finalQuizPassed;
  const paymentTransactionId = paymentTransaction?.payment_transaction_id;

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

  const refreshPaymentStatus = useCallback(async () => {
    if (!paymentTransactionId) return;

    try {
      setCheckingPayment(true);
      const result = await paymentAPI.getPaymentStatus(paymentTransactionId);
      setPaymentTransaction(result.data);
      if (result.data.status === 'paid' || result.data.purchase_status === 'completed') {
        showToast('Payment confirmed. Course access is active.', 'success');
        setPaymentModalOpen(false);
        setEnrollmentStatus('active');
        navigate('/courses');
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to check payment status', 'error');
    } finally {
      setCheckingPayment(false);
    }
  }, [navigate, paymentTransactionId, showToast]);

  useEffect(() => {
    if (!paymentModalOpen || !paymentTransaction || paymentTransaction.status !== 'pending') return;

    const intervalId = window.setInterval(() => {
      refreshPaymentStatus();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [paymentModalOpen, paymentTransaction?.status, paymentTransactionId, refreshPaymentStatus]);

  useEffect(() => {
    if (!paymentModalOpen || !paymentTransaction?.checkout_url) return;

    let cancelled = false;
    const containerId = 'payos-checkout-container';

    const loadPayOsScript = () =>
      new Promise<void>((resolve, reject) => {
        if (window.PayOSCheckout) {
          resolve();
          return;
        }

        const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://cdn.payos.vn/payos-checkout/v1/stable/payos-initialize.js"]');
        if (existingScript) {
          existingScript.addEventListener('load', () => resolve(), { once: true });
          existingScript.addEventListener('error', () => reject(new Error('Failed to load payOS checkout')), { once: true });
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.payos.vn/payos-checkout/v1/stable/payos-initialize.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load payOS checkout'));
        document.body.appendChild(script);
      });

    const mountPayOs = async () => {
      try {
        setPayOsEmbeddedError(null);
        await loadPayOsScript();
        if (cancelled || !window.PayOSCheckout) return;

        const container = document.getElementById(containerId);
        if (container) container.innerHTML = '';

        const checkout = window.PayOSCheckout.usePayOS({
          RETURN_URL: window.location.href,
          ELEMENT_ID: containerId,
          CHECKOUT_URL: paymentTransaction.checkout_url || '',
          embedded: true,
          onSuccess: () => {
            refreshPaymentStatus();
          },
          onCancel: () => {
            refreshPaymentStatus();
          },
          onExit: () => {
            refreshPaymentStatus();
          },
        });
        checkout.open();
      } catch (error) {
        if (!cancelled) setPayOsEmbeddedError(error instanceof Error ? error.message : 'Failed to load payOS checkout');
      }
    };

    mountPayOs();

    return () => {
      cancelled = true;
    };
  }, [paymentModalOpen, paymentTransaction?.checkout_url, refreshPaymentStatus]);

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

  if (!course) {
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
  const breadcrumbs = [
    { label: 'Home', path: '/' },
    {
      label: origin === '/courses' ? 'My Learning' : origin === '/explore' ? 'Explore Courses' : (effectiveEnrollmentStatus ? 'My Learning' : 'Explore Courses'),
      path: origin === '/courses' ? '/courses' : origin === '/explore' ? '/explore' : (effectiveEnrollmentStatus ? '/courses' : '/explore'),
    },
    { label: course.title },
  ];

  const modules: CourseModule[] = (course.lessons || []).map((lesson, index) => ({
    id: index + 1,
    title: lesson.title,
    videos: 1,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <Breadcrumbs items={breadcrumbs} />
      <main className="flex-1">
        {/* Hero Section */}
        <header className="relative overflow-hidden pt-20 pb-32 bg-gradient-to-br from-primary-fixed to-primary/10">
          <div className="absolute top-10 left-10 text-primary opacity-20 pointer-events-none">
            <span className="material-symbols-outlined text-[120px]">filter_vintage</span>
          </div>
          <div className="absolute bottom-10 right-20 text-primary opacity-5 pointer-events-none">
            <span className="material-symbols-outlined text-[200px]">filter_vintage</span>
          </div>

          <Container>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter relative z-10">
              <div className="md:col-span-7 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-stack-md">
                  <span className="bg-primary-container text-white px-3 py-1 rounded-full text-[12px] font-bold tracking-widest uppercase">
                    {course.is_free ? 'FREE' : 'PAID'}
                  </span>
                </div>
                <h1 className="font-display-lg text-display-lg text-primary mb-stack-md leading-tight">
                  {course.title}
                </h1>
                <Text variant="body-lg" color="on-surface-variant" className="mb-stack-lg max-w-xl">
                  {course.description || 'Explore this comprehensive course with structured lessons and interactive content.'}
                </Text>
                <div className="flex flex-wrap items-center gap-stack-lg mb-stack-lg">
                  <div className="h-10 w-px bg-outline-variant"></div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">schedule</span>
                    <span className="text-body-md font-semibold">{getCourseLessonCount(course)} Lessons</span>
                  </div>
                  <div className="h-10 w-px bg-outline-variant"></div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">timer</span>
                    <span className="text-body-md font-semibold">{formatCourseDuration(course.duration)}</span>
                  </div>
                  <div className="h-10 w-px bg-outline-variant"></div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">verified</span>
                    <span className="text-body-md font-semibold">Certificate included</span>
                  </div>
                </div>
                <div className="flex items-center gap-stack-md">
                  {enrollmentStatus === null ? (
                    <>
                      <Button onClick={handleEnroll} disabled={enrolling}>
                        {enrolling ? 'Enrolling...' : 'Enroll Now'}
                      </Button>
                      <div className="flex flex-col">
                        {!course.is_free && (
                          <span className="text-label-md text-on-surface-variant line-through">
                            ${(course.price * 1.5).toFixed(2)}
                          </span>
                        )}
                        <span className="text-headline-md font-bold text-primary">
                          {course.is_free ? 'FREE' : `$${course.price.toFixed(2)}`}
                        </span>
                      </div>
                    </>
                  ) : effectiveEnrollmentStatus === 'active' ? (
                    <>
                      <Button onClick={shouldShowFinalTestButton ? handleTakeFinalTest : handleGetStarted} variant="primary">
                        {shouldShowFinalTestButton ? 'Take Final Test' : 'Get Started'}
                      </Button>
                      {shouldShowFinalTestButton && (
                        <span className="text-label-md font-semibold text-on-surface-variant">
                          Final test required for certification
                        </span>
                      )}
                    </>
                  ) : effectiveEnrollmentStatus === 'completed' ? (
                    <>
                      <Button variant="secondary" disabled>
                        ✓ Completed
                      </Button>
                      <Button onClick={handleViewCertificate} variant="primary">
                        Certification
                      </Button>
                    </>
                  ) : (
                    <Button variant="secondary" disabled>
                      Dropped
                    </Button>
                  )}
                </div>
              </div>
              <div className="md:col-span-5 hidden md:block">
                <Card className="rotate-2 hover:rotate-0 transition-transform duration-500 overflow-hidden group">
                  {course.image_url ? (
                    <ImageCard
                      src={course.image_url}
                      alt={course.title}
                      overlay={{ gradient: true }}
                      aspectRatio="4:3"
                      hoverScale={110}
                      rounded="lg"
                      className="w-full shadow-2xl"
                    />
                  ) : (
                    <div className="flex aspect-[4/3] w-full items-center justify-center rounded-lg bg-surface-container-high shadow-2xl">
                      <span className="material-symbols-outlined text-[96px] text-outline">school</span>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </Container>
        </header>

        {/* Content Section */}
        <section className="py-section-gap">
          <Container>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
              <div className="md:col-span-4">
                <div className="sticky top-32">
                  <Heading level="h2" size="headline-lg" className="text-primary mb-stack-md">
                    Course Content
                  </Heading>
                  <Text variant="body-md" color="on-surface-variant" className="mb-stack-lg leading-relaxed">
                    This course contains {getCourseLessonCount(course)} lessons designed to help you master the material progressively.
                  </Text>
                  <Card className="p-6 bg-secondary-fixed/20 border border-secondary-fixed-dim">
                    <h4 className="font-bold text-on-surface mb-2">What's Included:</h4>
                    <ul className="space-y-2 text-on-surface-variant font-label-md">
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-green-600">check_circle</span>
                        {getCourseLessonCount(course)} Interactive Lessons
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-green-600">check_circle</span>
                        {formatCourseDuration(course.duration)} Total Duration
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-green-600">check_circle</span>
                        {course.lessons?.filter(l => Boolean(l.video_url?.trim())).length || 0} Video Lessons
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-green-600">check_circle</span>
                        Progress Tracking
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-green-600">check_circle</span>
                        Lifetime Access
                      </li>
                    </ul>
                  </Card>
                </div>
              </div>
              <div className="md:col-span-8 space-y-stack-md">
                {modules.length > 0 ? (
                  <>
                    {modules.map((module, idx) => (
                      <ModuleItem
                        key={module.id}
                        module={module}
                        lesson={course.lessons?.[idx]}
                        canPlay={Boolean(course.lessons?.[idx]?.is_completed || idx === firstUnfinishedLessonIndex)}
                        onPlay={() => {
                          const lessonId = course.lessons?.[idx]?.lesson_id;
                          if (!lessonId || !courseId) return;
                          navigate(`/courses/${courseId}/lessons/${lessonId}`);
                        }}
                      />
                    ))}
                    {finalQuiz && enrollmentStatus && (
                      <div className={`border p-stack-lg shadow-sm ${shouldShowFinalTestButton ? 'border-primary bg-primary-fixed/20' : finalQuizPassed ? 'border-emerald-300 bg-emerald-50' : 'border-outline-variant bg-surface-container-low'}`}>
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-label-md font-bold uppercase tracking-wide text-primary">Final test</p>
                            <h3 className="mt-1 font-headline-sm text-on-surface">{finalQuiz.title}</h3>
                            <p className="mt-1 text-label-md text-on-surface-variant">
                              {finalQuizPassed
                                ? finalQuiz.latest_attempt?.score != null
                                  ? `Requirement satisfied. Latest score: ${Number(finalQuiz.latest_attempt.score).toFixed(2)}%.`
                                  : 'Requirement satisfied.'
                                : allLessonsCompleted
                                  ? 'Complete this test to finish the course and unlock certification.'
                                  : 'Unlocks after all lessons are completed.'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleTakeFinalTest}
                            disabled={!allLessonsCompleted}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-bold text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined">assignment</span>
                            {finalQuizPassed ? 'Retake final' : 'Take final test'}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-on-surface-variant text-center py-8">No lessons yet</p>
                )}
              </div>
            </div>
          </Container>
        </section>

        {/* Rating Form Section */}
        {enrollmentStatus && user && (
          <section className="bg-primary-fixed/10 py-section-gap border-y border-outline-variant">
            <Container>
              <div className="mb-section-gap">
                <Heading level="h2" size="headline-lg" className="text-primary">
                  {userRating ? 'Update Your Review' : 'Share Your Experience'}
                </Heading>
                <Text variant="body-md" color="on-surface-variant" className="mt-2">
                  {userRating
                    ? 'You can update your rating and review anytime.'
                    : 'Your feedback helps other students learn better.'}
                </Text>
              </div>
              <div className="max-w-2xl">
                <RatingForm
                  courseId={parseInt(courseId!)}
                  userRating={userRating}
                  onSuccess={(newRating) => {
                    // Update local user's rating immediately and refresh list
                    setUserRating(newRating || null);
                    showToast('Your review has been submitted successfully!', 'success');
                    fetchReviews();
                  }}
                  onError={(error) => {
                    showToast(error, 'error');
                  }}
                  disabled={loading}
                />
              </div>
            </Container>
          </section>
        )}

        {/* Reviews Section */}
        <section className="bg-surface-container-low py-section-gap border-y border-outline-variant">
          <Container>
            <div className="flex justify-between items-end mb-section-gap">
              <div>
                <Heading level="h2" size="headline-lg" className="text-primary">
                  Student Reviews
                </Heading>
                <Text variant="body-md" color="on-surface-variant" className="mt-2">
                  What our students think about this course.
                </Text>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex text-secondary">
                  {[...Array(5)].map((_, i) => {
                    const starValue = i + 1;
                    const filled = averageRating >= starValue;

                    return (
                      <span key={i} className="material-symbols-outlined" style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}>
                        star
                      </span>
                    );
                  })}
                </div>
                <span className="font-bold text-headline-sm">{averageRating > 0 ? `${averageRating.toFixed(1)}/5.0` : 'No rating yet'}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              {orderedReviews.length > 0 ? (
                orderedReviews.map((review) => (
                  <ReviewItem
                    key={`${review.rating_id}`}
                    review={review}
                    isUser={Boolean(user && review.user_id === user.user_id)}
                  />
                ))
              ) : (
                <p className="text-on-surface-variant text-center py-8 md:col-span-3">No reviews for this course yet.</p>
              )}
            </div>
          </Container>
        </section>

      </main>
      {paymentModalOpen && paymentTransaction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-2 sm:p-4">
          <div className="max-h-[calc(100vh-1rem)] w-full max-w-6xl overflow-y-auto overflow-x-hidden rounded-xl border border-outline-variant bg-surface shadow-2xl sm:max-h-[calc(100vh-2rem)]">
            <div className="flex items-start justify-between gap-3 border-b border-outline-variant bg-surface-container-low p-4 sm:p-5">
              <div className="min-w-0">
                <p className="text-label-md font-black uppercase tracking-wide text-primary">payOS Payment</p>
                <h2 className="mt-1 truncate text-title-lg font-bold text-on-surface sm:text-headline-sm">{course.title}</h2>
                <p className="mt-1 text-body-sm text-on-surface-variant sm:text-body-md">
                  Scan the QR code with your banking app or open the payOS checkout link.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container"
                aria-label="Close payment dialog"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(430px,640px)_minmax(300px,360px)] lg:justify-center sm:p-5">
              <div className="overflow-hidden rounded-xl border border-outline-variant bg-white">
                <div
                  id="payos-checkout-container"
                  className="h-[520px] min-h-[420px] w-full overflow-hidden sm:h-[560px] lg:h-[600px] [&_iframe]:h-full [&_iframe]:min-h-[420px] [&_iframe]:w-full sm:[&_iframe]:min-h-[560px] lg:[&_iframe]:min-h-[600px]"
                />
                {payOsEmbeddedError && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
                    <p className="font-bold">Embedded checkout unavailable</p>
                    <p className="mt-1 text-body-md">{payOsEmbeddedError}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
                    <p className="text-label-md text-on-surface-variant">Amount</p>
                    <p className="mt-1 text-title-lg font-bold text-primary">{formatVnd(paymentTransaction.amount)}</p>
                  </div>
                  <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
                    <p className="text-label-md text-on-surface-variant">Status</p>
                    <p className="mt-1 text-title-sm font-bold uppercase text-primary">{paymentTransaction.status}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
                  <p className="text-label-md text-on-surface-variant">Transfer content</p>
                  <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                    <code className="min-w-0 break-all rounded-md bg-surface px-3 py-2 text-label-lg font-bold text-on-surface">
                      {paymentTransaction.payment_content}
                    </code>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(paymentTransaction.payment_content)}
                      className="inline-flex h-10 items-center gap-1 rounded-md border border-outline-variant bg-surface px-3 text-label-md font-bold text-primary hover:border-primary"
                    >
                      <span className="material-symbols-outlined text-[18px]">content_copy</span>
                      Copy
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-emerald-900">
                  <p className="text-title-sm font-bold">Automatic activation</p>
                  <p className="mt-1 text-body-sm">
                    Course access is activated automatically after payOS sends a verified payment webhook to the system.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                  <Button type="button" size="sm" className="min-h-10 rounded-md px-3 text-label-md" onClick={refreshPaymentStatus} disabled={checkingPayment}>
                    {checkingPayment ? 'Checking...' : 'Check payment status'}
                  </Button>
                  {paymentTransaction.checkout_url && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="min-h-10 rounded-md px-3 text-label-md"
                      onClick={() => window.open(paymentTransaction.checkout_url || undefined, '_blank', 'noopener,noreferrer')}
                    >
                      Open checkout
                    </Button>
                  )}
                  <Button type="button" size="sm" variant="secondary" className="min-h-10 rounded-md px-3 text-label-md" onClick={() => setPaymentModalOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
