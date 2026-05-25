import { useEffect } from 'react';
import { Container } from '../ui';
import { Heading, Text } from '../ui/Typography';
import type { User } from '../../contexts/AuthContext';
import type { ReviewCard } from './courseDetailUtils';
import { ReviewItem } from './ReviewItem';

interface CourseReviewsSectionProps {
  orderedReviews: ReviewCard[];
  averageRating: number;
  user: User | null;
  highlightedRatingId?: number;
}

export function CourseReviewsSection({
  orderedReviews,
  averageRating,
  user,
  highlightedRatingId,
}: CourseReviewsSectionProps) {
  useEffect(() => {
    if (!highlightedRatingId || orderedReviews.length === 0) return;

    const target = document.getElementById(`review-${highlightedRatingId}`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightedRatingId, orderedReviews.length]);

  return (
    <section id="reviews" className="bg-surface-container-low py-section-gap border-y border-outline-variant">
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
              {[...Array(5)].map((_, index) => {
                const starValue = index + 1;
                const filled = averageRating >= starValue;

                return (
                  <span
                    key={starValue}
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    star
                  </span>
                );
              })}
            </div>
            <span className="font-bold text-headline-sm">
              {averageRating > 0 ? `${averageRating.toFixed(1)}/5.0` : 'No rating yet'}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {orderedReviews.length > 0 ? (
            orderedReviews.map((review) => (
              <ReviewItem
                key={`${review.rating_id}`}
                review={review}
                isUser={Boolean(user && review.user_id === user.user_id)}
                isHighlighted={highlightedRatingId === review.rating_id}
              />
            ))
          ) : (
            <p className="text-on-surface-variant text-center py-8 md:col-span-3">No reviews for this course yet.</p>
          )}
        </div>
      </Container>
    </section>
  );
}
