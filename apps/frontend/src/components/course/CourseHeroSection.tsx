import { Button } from '../Button';
import { Card, Container, ImageCard } from '../ui';
import { Text } from '../ui/Typography';
import type { Course } from '../../services/api';
import { getCourseLessonCount } from '../../utils/course';
import { formatCourseDuration } from './courseDetailUtils';

interface CourseHeroSectionProps {
  course: Course;
  enrollmentStatus: string | null;
  effectiveEnrollmentStatus: string | null;
  enrolling: boolean;
  shouldShowFinalTestButton: boolean;
  onEnroll: () => void;
  onGetStarted: () => void;
  onTakeFinalTest: () => void;
  onViewCertificate: () => void;
}

export function CourseHeroSection({
  course,
  enrollmentStatus,
  effectiveEnrollmentStatus,
  enrolling,
  shouldShowFinalTestButton,
  onEnroll,
  onGetStarted,
  onTakeFinalTest,
  onViewCertificate,
}: CourseHeroSectionProps) {
  return (
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
              <div className="h-10 w-px bg-outline-variant" />
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">schedule</span>
                <span className="text-body-md font-semibold">{getCourseLessonCount(course)} Lessons</span>
              </div>
              <div className="h-10 w-px bg-outline-variant" />
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">timer</span>
                <span className="text-body-md font-semibold">{formatCourseDuration(course.duration)}</span>
              </div>
              <div className="h-10 w-px bg-outline-variant" />
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">verified</span>
                <span className="text-body-md font-semibold">Certificate included</span>
              </div>
            </div>
            <div className="flex items-center gap-stack-md">
              {enrollmentStatus === null ? (
                <>
                  <Button onClick={onEnroll} disabled={enrolling}>
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
                  <Button onClick={shouldShowFinalTestButton ? onTakeFinalTest : onGetStarted} variant="primary">
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
                    Completed
                  </Button>
                  <Button onClick={onViewCertificate} variant="primary">
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
  );
}
