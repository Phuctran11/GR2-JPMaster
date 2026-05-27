import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Footer, Card, Container, Section, Breadcrumbs, Pagination } from '../components';
import { Heading, Text } from '../components/ui/Typography';
import { MotionSectionFrame } from '../components/ui';
import { MyLearningCard } from '../components/cards';
import { enrollmentAPI, type EnrolledCourse } from '../services/api';
import { useToastMessages } from '../hooks/useToastMessages';

export default function CourseList() {
  const navigate = useNavigate();
  const toastMessages = useToastMessages();
  const [activeStatus, setActiveStatus] = useState<'active' | 'completed'>('active');
  const [page, setPage] = useState(1);
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 5;

  useEffect(() => {
    let active = true;

    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await enrollmentAPI.getMyCoursesByStatus(activeStatus, pageSize, (page - 1) * pageSize);
        if (!active) return;
        setCourses(response.data);
        setTotalCount(response.total_count ?? response.count);
      } catch (err) {
        if (!active) return;
        const errorMessage = err instanceof Error ? err.message : 'Failed to load courses';
        setError(errorMessage);
        toastMessages.error(errorMessage);
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
  }, [activeStatus, page, toastMessages]);

  const handleOpenCourseDetail = (courseId: number) => {
    navigate(`/courses/${courseId}`);
  };

  const handleGetStarted = async (courseId: number) => {
    try {
      const enrollment = courses.find((item) => item.course_id === courseId);
      if (enrollment?.course.lessons?.length && enrollment.status === 'active' && (enrollment.progress_percent ?? 0) >= 100) {
        navigate(`/courses/${courseId}/final-test`);
        return;
      }

      const lessonResult = await enrollmentAPI.getNextLesson(courseId);
      navigate(`/courses/${courseId}/lessons/${lessonResult.data.lesson_id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to open lesson';
      setError(errorMessage);
      toastMessages.error(errorMessage);
    }
  };

  const handleViewCertificate = (courseId: number) => {
    navigate(`/courses/${courseId}/certificate`);
  };

  const getEffectiveStatus = (enrollment: EnrolledCourse): 'active' | 'completed' | 'dropped' => {
    return enrollment.status;
  };

  const getStatusLabel = (status: 'active' | 'completed' | 'dropped'): 'In Progress' | 'Completed' | 'Not Started' => {
    if (status === 'active') return 'In Progress';
    if (status === 'completed') return 'Completed';
    return 'Not Started';
  };

  useEffect(() => {
    setPage(1);
  }, [activeStatus]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(totalCount / pageSize));
    if (page > maxPage) setPage(maxPage);
  }, [page, totalCount]);

  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'My Learning' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <Breadcrumbs items={breadcrumbs} />
      <main className="flex-1">
        <Section bgColor="light">
          <Container>
            <div className="mb-section-gap">
              <MotionSectionFrame index={0} preset="hero" className="mb-stack-lg">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <Heading level="h1" size="display-lg" className="flex items-center gap-3">
                    <span className="w-1.5 h-8 bg-secondary-fixed rounded-full"></span>
                    My Learning
                  </Heading>
                  <Text variant="body-lg" color="on-surface-variant" className="mt-3 max-w-2xl">
                    Track the courses you are currently studying or have already completed.
                  </Text>
                </div>
                <div className="flex flex-wrap gap-3">
                  {(['active', 'completed'] as const).map((status) => {
                    const label = status === 'active' ? 'In Progress' : 'Completed';
                    return (
                      <button
                        key={status}
                        type="button"
                          onClick={() => setActiveStatus(status)}
                        className={`rounded-full px-4 py-2 text-label-md font-semibold transition-colors border ${
                          activeStatus === status
                            ? 'bg-primary text-on-primary border-primary'
                            : 'bg-surface text-on-surface-variant border-outline-variant hover:border-primary hover:text-primary'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              </MotionSectionFrame>

              <MotionSectionFrame index={1} preset="sweep" className="mb-stack-lg">
                <div className="flex items-center justify-between">
                  <Heading level="h2" size="headline-lg" className="flex items-center gap-3">
                    <span className="w-1.5 h-8 bg-secondary-fixed rounded-full"></span>
                    {activeStatus === 'active' ? 'In Progress' : 'Completed'} Courses
                  </Heading>
                </div>
              </MotionSectionFrame>

              {error && (
                <Card className="p-4 bg-error-container text-error border border-error mb-stack-lg">
                  <Text variant="body-md">{error}</Text>
                </Card>
              )}

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Text variant="body-lg" color="on-surface-variant">
                    Loading courses...
                  </Text>
                </div>
              ) : courses.length === 0 ? (
                <Card className="p-8 text-center border border-outline-variant">
                  <Text variant="body-lg" color="on-surface-variant">
                    No courses found. Start exploring and enroll in a course!
                  </Text>
                </Card>
              ) : (
                <MotionSectionFrame index={2} className="flex flex-col gap-gutter">
                  {courses.map((enrollment) => {
                    const effectiveStatus = getEffectiveStatus(enrollment);
                    const needsFinalTest = effectiveStatus === 'active' && (enrollment.progress_percent ?? 0) >= 99.99;

                    return (
                    <div key={enrollment.enrollment_id} className="w-full">
                      <MyLearningCard
                        courseId={enrollment.course_id}
                        title={enrollment.course.title}
                        progress={enrollment.progress_percent ?? (effectiveStatus === 'completed' ? 100 : 0)}
                        status={getStatusLabel(effectiveStatus)}
                        needsFinalTest={needsFinalTest}
                        image={enrollment.course.image_url}
                        onClick={handleOpenCourseDetail}
                        onGetStarted={handleGetStarted}
                        onViewCertificate={handleViewCertificate}
                      />
                    </div>
                    );
                  })}
                  <Pagination page={page} pageSize={pageSize} itemCount={courses.length} totalCount={totalCount} onPageChange={setPage} className="mt-5" />
                </MotionSectionFrame>
              )}
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
