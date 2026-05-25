import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Footer, Container, Section, Breadcrumbs, Pagination } from '../components';
import {
  CourseExploreGrid,
  CourseExploreHero,
  CourseFilterSidebar,
} from '../components/courseExplore';
import { useToast } from '../contexts/ToastContext';
import { useCourseExploreData } from '../hooks/course/useCourseExploreData';
import { DEFAULT_COURSE_LEVEL, DEFAULT_COURSE_SORT } from '../components/courseExplore/courseExploreUtils';

export default function CourseExplore() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [level, setLevel] = useState(DEFAULT_COURSE_LEVEL);
  const [sort, setSort] = useState(DEFAULT_COURSE_SORT);
  const pageSize = 4;

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' | 'warning') => addToast(message, type),
    [addToast],
  );

  const { courses, totalCount, loading } = useCourseExploreData({ showToast, page, pageSize, level, sort });

  useEffect(() => {
    setPage(1);
  }, [level, sort]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(totalCount / pageSize));
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [page, totalCount]);

  const handleCourseClick = (courseId: number) => {
    navigate(`/courses/${courseId}`, { state: { from: '/explore' } });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-on-surface-variant">Loading courses...</p>
        </main>
        <Footer />
      </div>
    );
  }

  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'Explore Courses' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <Breadcrumbs items={breadcrumbs} />
      <main className="flex-1">
        <Section bgColor="light">
          <Container>
            <CourseExploreHero />

            <div className="mb-section-gap space-y-6">
              <CourseFilterSidebar
                level={level}
                sort={sort}
                onLevelChange={setLevel}
                onSortChange={setSort}
              />

              <CourseExploreGrid
                courses={courses}
                totalCount={totalCount}
                onCourseClick={handleCourseClick}
              />
              <Pagination
                page={page}
                pageSize={pageSize}
                itemCount={courses.length}
                totalCount={totalCount}
                onPageChange={setPage}
                className="mt-6"
              />
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
