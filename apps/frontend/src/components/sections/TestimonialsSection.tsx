import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Section, SectionHeader, StarRating } from '../ui';
import { ratingAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const FEEDBACK_REFRESH_INTERVAL_MS = 60_000;

interface Review {
  rating_id: number;
  course_id: number;
  course_title: string;
  average_rating: number;
  rating_count?: number;
  user_id: number;
  username: string;
  rating: number;
  review: string;
  created_at: string;
  updated_at?: string;
  activity_at?: string;
}

function getDisplayDate(review: Review) {
  return new Date(review.activity_at || review.updated_at || review.created_at).toLocaleDateString();
}

function FeedbackCard({
  review,
  isCurrentLearner,
  onOpen,
}: {
  review: Review;
  isCurrentLearner: boolean;
  onOpen: (courseId: number, ratingId: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(review.course_id, review.rating_id)}
      className={`testimonial-card w-[300px] sm:w-[360px] md:w-[420px] shrink-0 rounded-lg border bg-surface-container-lowest p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-primary hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary ${
        isCurrentLearner ? 'border-primary/70 ring-2 ring-primary/15' : 'border-outline-variant/70'
      }`}
      aria-label={`Open ${review.course_title} from ${review.username}'s feedback`}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-bold text-primary">{review.username}</p>
            {isCurrentLearner && (
              <span className="rounded-full bg-primary-fixed px-2 py-0.5 text-[11px] font-bold text-on-primary-fixed">
                Your feedback
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-sm font-semibold text-on-surface-variant">{review.course_title}</p>
        </div>
        <div className="rounded-full bg-secondary-container px-3 py-1 text-sm font-bold text-on-secondary-container">
          {review.rating.toFixed(1)}
        </div>
      </div>

      <StarRating rating={review.rating} size="sm" className="mb-5" />

      <p className="min-h-[120px] text-base italic leading-7 text-on-surface">
        "{review.review}"
      </p>

      <div className="mt-6 flex items-center justify-between border-t border-outline-variant pt-4 text-xs font-semibold text-on-surface-variant">
        <span>{getDisplayDate(review)}</span>
        <span>{review.rating_count || 0} reviews</span>
      </div>
    </button>
  );
}

export function TestimonialsSection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const dragStartX = useRef(0);
  const dragStartScrollLeft = useRef(0);
  const dragMoved = useRef(false);

  const updateDragPosition = useCallback((clientX: number) => {
    if (!sliderRef.current) return;

    const deltaX = clientX - dragStartX.current;
    if (Math.abs(deltaX) > 4) {
      dragMoved.current = true;
    }

    sliderRef.current.scrollLeft = dragStartScrollLeft.current - deltaX;
  }, []);

  const stopDragging = useCallback(() => {
    setIsDragging(false);
    window.setTimeout(() => {
      dragMoved.current = false;
    }, 0);
  }, []);

  useEffect(() => {
    let active = true;

    const fetchReviews = async () => {
      try {
        const res = await ratingAPI.getLearnerFeedbackTestimonials();
        if (!active) return;
        setReviews(res.data || []);
      } catch (error) {
        console.error('Failed to load learner feedback', error);
      }
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchReviews();
      }
    };

    fetchReviews();
    const refreshInterval = window.setInterval(fetchReviews, FEEDBACK_REFRESH_INTERVAL_MS);
    window.addEventListener('focus', fetchReviews);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      active = false;
      window.clearInterval(refreshInterval);
      window.removeEventListener('focus', fetchReviews);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, []);

  const prioritizedReviews = useMemo(() => {
    if (!user) return reviews;

    return [...reviews].sort((a, b) => {
      const aIsCurrentLearner = a.user_id === user.user_id ? 1 : 0;
      const bIsCurrentLearner = b.user_id === user.user_id ? 1 : 0;
      return bIsCurrentLearner - aIsCurrentLearner;
    });
  }, [reviews, user]);

  const duration = Math.max(prioritizedReviews.length * 7, 28);

  const handleReviewClick = (courseId: number, ratingId: number) => {
    navigate(`/courses/${courseId}#reviews`, {
      state: { targetRatingId: ratingId },
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleWindowPointerMove = (event: globalThis.PointerEvent) => {
      updateDragPosition(event.clientX);
    };

    window.addEventListener('pointerup', stopDragging);
    window.addEventListener('pointercancel', stopDragging);
    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('blur', stopDragging);

    return () => {
      window.removeEventListener('pointerup', stopDragging);
      window.removeEventListener('pointercancel', stopDragging);
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('blur', stopDragging);
    };
  }, [isDragging, stopDragging, updateDragPosition]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !sliderRef.current) return;

    setIsDragging(true);
    dragMoved.current = false;
    dragStartX.current = event.clientX;
    dragStartScrollLeft.current = sliderRef.current.scrollLeft;
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updateDragPosition(event.clientX);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;

    stopDragging();
  };

  const handleClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!dragMoved.current) return;

    event.preventDefault();
    event.stopPropagation();
    dragMoved.current = false;
  };

  return (
    <Section bgColor="light">
      <Container>
        <SectionHeader
          badge="Learner Feedback"
          title="What Learners Say After Class"
          className="mb-12"
        />

        {prioritizedReviews.length > 0 ? (
          <div
            ref={sliderRef}
            className={`testimonial-slider group -mx-margin-mobile overflow-x-auto px-margin-mobile md:-mx-margin-desktop md:px-margin-desktop ${isDragging ? 'is-dragging' : ''}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onClickCapture={handleClickCapture}
          >
            <div
              className="testimonial-slider-track flex w-max py-2"
              style={{ animationDuration: `${duration}s` }}
            >
              {[0, 1].map((groupIndex) => (
                <div key={groupIndex} className="testimonial-slider-group flex shrink-0 gap-6 pr-6">
                  {prioritizedReviews.map((review) => (
                    <FeedbackCard
                      key={`${groupIndex}-${review.rating_id}`}
                      review={review}
                      isCurrentLearner={review.user_id === user?.user_id}
                      onOpen={handleReviewClick}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-outline-variant bg-surface-container-low p-8 text-center text-on-surface-variant">
            No learner feedback above 4 stars yet.
          </div>
        )}
      </Container>
    </Section>
  );
}
