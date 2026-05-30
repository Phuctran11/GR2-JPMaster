import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Section, SectionHeader } from '../ui';
import { CourseGridCard, FeaturedCourseCard } from '../cards';
// import { Heading, Text } from '../ui/Typography';
import { courseAPI, type Course } from '../../services/api';
import { getCourseLessonCount } from '../../utils/course';



export function FeaturedCoursesSection() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    let active = true;

    const fetchPopular = async () => {
      try {
        const res = await courseAPI.getPopularCourses(4);
        if (!active) return;
        const detailedCourses = await Promise.all(
          (res.data || []).map(async (course) => {
            try {
              const detailResult = await courseAPI.getCourseById(course.course_id);
              return detailResult.data;
            } catch (error) {
              console.error(`Failed to load course detail for ${course.course_id}`, error);
              return course;
            }
          })
        );

        if (!active) return;
        setCourses(detailedCourses);
      } catch (error) {
        console.error('Failed to load popular courses', error);
        setCourses([]);
      }
    };

    fetchPopular();
    return () => {
      active = false;
    };
  }, []);

  const featured = courses[0];
  const others = courses.slice(1);

  const handleCourseClick = (courseId: number) => {
    navigate(`/courses/${courseId}`);
  };

  return (
    <Section bgColor="muted">
      <div
        className="absolute top-0 right-0 w-full h-full opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCIgdmlld0JveD0iMCAwIDMwIDMwIj48cGF0aCBkPSJNMCAwbDE1IDE1TDMwIDAgMTUgMzAgMCAweiIgZmlsbD0iIzAwMjM2ZiIvPjwvc3ZnPg==")',
        }}></div>
      <Container className="relative z-10">
        <SectionHeader
          badge="Featured Programs"
          title="Master Your Structured Path"
          description="Break the traditional learning barrier with courses that blend culture, ethics, and language proficiency."
          cta={{ label: 'View All Courses', href: '/explore' }}
          className="mb-12"
        />
        {featured ? (
          <FeaturedCourseCard
            title={featured.title}
            description={featured.description ?? ''}
            price={String(featured.price)}
            image={featured.image_url}
            isFree={Number(featured.price) === 0}
            courseId={featured.course_id}
            onEnroll={handleCourseClick}
            lessonCount={getCourseLessonCount(featured)}
            averageRating={featured.average_rating}
            ratingCount={featured.rating_count}
            createdBy={featured.creator_username || `Creator #${featured.created_by}`}
            createdAt={featured.created_at}
            duration={featured.duration}
          />
        ) : null}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {others.map((course) => (
            <div key={course.course_id} onClick={() => handleCourseClick(course.course_id)} className="cursor-pointer">
              <CourseGridCard
                title={course.title}
                description={course.description || ''}
                price={String(course.price)}
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
      </Container>
    </Section>
  );
}
