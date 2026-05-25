import { FeaturedCourseCard, CourseGridCard } from '../cards';
import { Heading } from '../ui/Typography';
import type { Course } from '../../services/api';

interface CourseExploreGridProps {
  courses: Course[];
  totalCount?: number;
  onCourseClick: (courseId: number) => void;
}

export function CourseExploreGrid({ courses, totalCount, onCourseClick }: CourseExploreGridProps) {
  const featuredCourse = courses[0];
  const displayedCount = totalCount ?? courses.length;

  return (
    <div>
      <Heading level="h2" size="headline-lg" className="mb-stack-lg flex items-center gap-3">
        <span className="w-1.5 h-8 bg-secondary-fixed rounded-full"></span>
        Available Courses ({displayedCount})
      </Heading>
      {courses.length > 0 ? (
        <div className="space-y-gutter">
          {featuredCourse ? (
            <FeaturedCourseCard
              title={featuredCourse.title}
              description={featuredCourse.description ?? ''}
              price={featuredCourse.price.toFixed(2)}
              isFree={Number(featuredCourse.price) === 0}
              image={featuredCourse.image_url}
              courseId={featuredCourse.course_id}
              onEnroll={onCourseClick}
              averageRating={featuredCourse.average_rating}
              ratingCount={featuredCourse.rating_count}
              createdBy={featuredCourse.creator_username || `Creator #${featuredCourse.created_by}`}
              createdAt={featuredCourse.created_at}
              duration={featuredCourse.duration}
            />
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">
            {courses.slice(1).map((course) => (
              <div
                key={course.course_id}
                onClick={() => onCourseClick(course.course_id)}
                className="cursor-pointer"
              >
                <CourseGridCard
                  title={course.title}
                  description={course.description ?? ''}
                  price={course.price.toFixed(2)}
                  image={course.image_url}
                  isFree={Number(course.price) === 0}
                  courseId={course.course_id}
                  onEnroll={onCourseClick}
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
  );
}
