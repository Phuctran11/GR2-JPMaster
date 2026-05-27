import { Link } from 'react-router-dom';
import { Heading, Text } from '../ui/Typography';

export function CourseExploreHero() {
  return (
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
  );
}
