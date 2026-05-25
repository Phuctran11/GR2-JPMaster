import { Container } from '../ui';
import { Heading, Text } from '../ui/Typography';
import { RatingForm } from '../cards/RatingForm';
import type { ReviewCard } from './courseDetailUtils';

interface CourseRatingSectionProps {
  courseId: number;
  userRating: ReviewCard | null;
  loading: boolean;
  onSuccess: (newRating?: ReviewCard | null) => void;
  onError: (error: string) => void;
}

export function CourseRatingSection({
  courseId,
  userRating,
  loading,
  onSuccess,
  onError,
}: CourseRatingSectionProps) {
  return (
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
            courseId={courseId}
            userRating={userRating}
            onSuccess={onSuccess}
            onError={onError}
            disabled={loading}
          />
        </div>
      </Container>
    </section>
  );
}
