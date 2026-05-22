import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header, Footer, Select, Card, Container, Section, Breadcrumbs } from '../components';
import { Heading, Text } from '../components/ui/Typography';
import { FeaturedCourseCard, CourseGridCard } from '../components/cards';
import { courseAPI, type Course } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface CourseFilterSidebarProps {
  level: string;
  sort: string;
  onLevelChange: (value: string) => void;
  onSortChange: (value: string) => void;
}

function CourseFilterSidebar({ level, sort, onLevelChange, onSortChange }: CourseFilterSidebarProps) {
  const handleRemoveLevel = () => {
    onLevelChange('all');
  };

  const handleRemoveSort = () => {
    onSortChange('newest');
  };

  return (
    <Card className="p-6 border border-outline-variant bg-surface-container-low h-fit lg:sticky lg:top-28">
      <div className="mb-5">
        <h3 className="text-headline-md font-bold text-on-surface flex items-center gap-2">
          <span className="w-1.5 h-6 bg-gradient-to-b from-primary to-secondary rounded-full"></span>
          Filter Courses
        </h3>
        <p className="text-label-md text-on-surface-variant mt-2">
          Narrow results by level and sort order.
        </p>
      </div>

      <div className="space-y-5">
        <div className="bg-primary-container/40 p-4 rounded-xl border border-primary/20">
          <label className="block text-label-lg font-bold text-on-surface uppercase tracking-wide mb-3">Level</label>
          <Select
            options={[
              { value: 'all', label: 'All Levels' },
              { value: 'beginner', label: 'Beginner (N5-N4)' },
              { value: 'intermediate', label: 'Intermediate (N3-N2)' },
              { value: 'advanced', label: 'Advanced (N1)' },
            ]}
            value={level}
            onChange={(e) => onLevelChange(e.target.value)}
          />
          <p className="text-label-sm text-on-surface-variant mt-2">Filter by JLPT difficulty.</p>
        </div>

        <div className="bg-secondary-container/40 p-4 rounded-xl border border-secondary/20">
          <label className="block text-label-lg font-bold text-on-surface uppercase tracking-wide mb-3">Sort</label>
          <Select
            options={[
              { value: 'newest', label: 'Newest' },
              { value: 'free', label: 'Free Courses' },
              { value: 'price-low', label: 'Price: Low to High' },
              { value: 'price-high', label: 'Price: High to Low' },
            ]}
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
          />
          <p className="text-label-sm text-on-surface-variant mt-2">Sort by date, access type, or price.</p>
        </div>
      </div>

      {(level !== 'all' || sort !== 'newest') && (
        <div className="mt-5 pt-4 border-t border-outline-variant flex flex-wrap gap-2">
          {level !== 'all' && (
            <span className="inline-flex items-center gap-2 px-3 py-2 bg-primary-fixed text-on-primary-fixed rounded-full text-label-sm font-semibold">
              Level: {level.charAt(0).toUpperCase() + level.slice(1)}
              <button
                onClick={handleRemoveLevel}
                className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full hover:bg-on-primary-fixed/20 transition-colors duration-200"
                title="Remove level filter"
              >
                ✕
              </button>
            </span>
          )}
          {sort !== 'newest' && (
            <span className="inline-flex items-center gap-2 px-3 py-2 bg-secondary-fixed text-on-secondary-fixed rounded-full text-label-sm font-semibold">
              Sort: {sort === 'price-low' ? 'Low Price' : sort === 'price-high' ? 'High Price' : sort === 'free' ? 'Free' : sort}
              <button
                onClick={handleRemoveSort}
                className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full hover:bg-on-secondary-fixed/20 transition-colors duration-200"
                title="Remove sort filter"
              >
                ✕
              </button>
            </span>
          )}
        </div>
      )}
    </Card>
  );
}

export default function CourseExplore() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState('all');
  const [sort, setSort] = useState('newest');
  const { addToast } = useToast();
  const navigate = useNavigate();
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => addToast(message, type);

  // Filter and sort logic
  useEffect(() => {
    let result = [...courses];

    // Apply level filter
    if (level !== 'all') {
      result = result.filter((course) => {
        const courseLevel = (course as any).level?.toLowerCase() || '';
        return courseLevel === level;
      });
    }

    // Apply free courses filter if sort is set to 'free'
    if (sort === 'free') {
      result = result.filter((course) => course.is_free);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sort) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'free':
          // For free courses, sort by newest
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredCourses(result);
  }, [courses, level, sort]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        // Fetch popular courses first (already sorted by enrollment count + newest)
        const popularResult = await courseAPI.getPopularCourses(1);
        const topCourse = popularResult.data[0];

        // Fetch all courses
        const allResult = await courseAPI.getAllCourses(20, 0);
        let allCourses = allResult.data;

        // Sort courses: top popular first, then by date (newest)
        const sortedCourses = allCourses.sort((a, b) => {
          // Top course goes first
          if (topCourse && a.course_id === topCourse.course_id) return -1;
          if (topCourse && b.course_id === topCourse.course_id) return 1;
          
          // Then sort by enrollment count (if available)
          const enrollA = a.enroll_count || 0;
          const enrollB = b.enroll_count || 0;
          if (enrollB !== enrollA) return enrollB - enrollA;
          
          // Finally by newest date
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA;
        });

        setCourses(sortedCourses);
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Failed to load courses', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

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
            <div className="mb-section-gap">
              <div className="flex items-center justify-between mb-stack-lg">
                <Heading level="h1" size="display-lg" className="flex items-center gap-3">
                  <span className="w-1.5 h-8 bg-secondary-fixed rounded-full"></span>
                  Explore Courses
                </Heading>
                <Link to="/courses" className="text-label-md text-primary font-semibold hover:underline">
                  My learning
                </Link>
              </div>
              <Text variant="body-lg" color="on-surface-variant" className="mb-stack-lg max-w-2xl">
                Browse the full catalog and compare course levels based on JLPT difficulty.
              </Text>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-section-gap">
              <aside className="lg:col-span-4 xl:col-span-3">
                <CourseFilterSidebar 
                  level={level}
                  sort={sort}
                  onLevelChange={setLevel}
                  onSortChange={setSort}
                />
              </aside>

              <div className="lg:col-span-8 xl:col-span-9">
                <Heading level="h2" size="headline-lg" className="mb-stack-lg flex items-center gap-3">
                  <span className="w-1.5 h-8 bg-secondary-fixed rounded-full"></span>
                  Available Courses ({filteredCourses.length})
                </Heading>
                {filteredCourses.length > 0 ? (
                  <div className="space-y-gutter">
                    {filteredCourses[0] ? (
                      <FeaturedCourseCard
                        title={filteredCourses[0].title}
                        description={filteredCourses[0].description ?? ''}
                        price={filteredCourses[0].price.toFixed(2)}
                        isFree={Number(filteredCourses[0].price) === 0}
                        image={filteredCourses[0].image_url}
                        courseId={filteredCourses[0].course_id}
                        onEnroll={handleCourseClick}
                        averageRating={filteredCourses[0].average_rating}
                        ratingCount={filteredCourses[0].rating_count}
                        createdBy={filteredCourses[0].creator_username || `Creator #${filteredCourses[0].created_by}`}
                        createdAt={filteredCourses[0].created_at}
                        duration={filteredCourses[0].duration}
                      />
                    ) : null}

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">
                      {filteredCourses.slice(1).map((course) => (
                        <div
                          key={course.course_id}
                          onClick={() => handleCourseClick(course.course_id)}
                          className="cursor-pointer"
                        >
                          <CourseGridCard
                            title={course.title}
                            description={course.description ?? ''}
                            price={course.price.toFixed(2)}
                            image={course.image_url}
                            isFree={Number(course.price) === 0}
                            courseId={course.course_id}
                            onEnroll={handleCourseClick}
                            averageRating={course.average_rating}
                            ratingCount={course.rating_count}
                            createdBy={course.creator_username || `Creator #${course.created_by}`}
                            createdAt={course.created_at}
                            duration={course.duration}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-on-surface-variant text-center py-8">No courses available</p>
                )}
              </div>
            </div>

            <Card className="p-8 border border-outline-variant">
              <Heading level="h3" size="headline-md" className="mb-3">
                Explore from here
              </Heading>
              <Text variant="body-md" color="on-surface-variant">
                Open a course card to view details, or go back to My learning to continue your enrolled courses.
              </Text>
            </Card>
          </Container>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
