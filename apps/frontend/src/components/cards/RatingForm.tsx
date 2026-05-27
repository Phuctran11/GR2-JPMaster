import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ratingAPI } from '../../services/api';
import { Card } from '../ui';
import { Heading, Text } from '../ui/Typography';
import { Button } from '../Button';
import { getFieldError, validationMessages } from '../../utils/formValidation';

interface UserRating {
  rating_id: number;
  user_id: number;
  username?: string;
  rating: number;
  review: string | null;
  created_at: string;
}

interface RatingFormProps {
  courseId: number;
  userRating?: UserRating | null;
  onSuccess?: (newRating?: UserRating | null) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

type RatingFormValues = {
  rating: number;
  review: string;
};

export function RatingForm({ courseId, userRating, onSuccess, onError, disabled = false }: RatingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const isEditing = !!userRating;
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RatingFormValues>({
    defaultValues: {
      rating: userRating?.rating || 0,
      review: userRating?.review || '',
    },
    mode: 'onBlur',
  });

  const rating = watch('rating');
  const review = watch('review');

  useEffect(() => {
    reset({
      rating: userRating?.rating || 0,
      review: userRating?.review || '',
    });
  }, [reset, userRating]);

  const onSubmit = async (values: RatingFormValues) => {
    try {
      setIsSubmitting(true);
      if (isEditing && userRating) {
        const res = await ratingAPI.updateRating(userRating.rating_id, values.rating, values.review || undefined);
        const updated = res.data as UserRating;
        reset({ rating: updated.rating, review: updated.review || '' });
        onSuccess?.(updated);
      } else {
        const res = await ratingAPI.createRating(courseId, values.rating, values.review || undefined);
        const created = res.data as UserRating;
        reset({ rating: created.rating, review: created.review || '' });
        onSuccess?.(created);
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing || !userRating) return;

    if (!confirm('Are you sure you want to delete your review?')) {
      return;
    }

    try {
      setIsSubmitting(true);
      await ratingAPI.deleteRating(userRating.rating_id);
      reset({ rating: 0, review: '' });
      onSuccess?.(null);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to delete rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-surface p-8 border border-outline-variant">
      <Heading level="h3" size="headline-md" className="text-on-surface mb-2">
        {isEditing ? 'Update Your Review' : 'Share Your Review'}
      </Heading>
      <Text variant="body-md" color="on-surface-variant" className="mb-6">
        {isEditing
          ? 'You can update your rating and review anytime.'
          : 'Help other students by sharing your experience with this course'}
      </Text>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <input
          type="hidden"
          {...register('rating', {
            required: validationMessages.required('Rating'),
            valueAsNumber: true,
            min: { value: 1, message: validationMessages.min('Rating', 1) },
            max: { value: 5, message: 'Rating must be at most 5' },
          })}
        />
        {/* Star Rating */}
        <div>
          <label className="block text-label-lg font-bold text-on-surface mb-3">
            Rate this course
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setValue('rating', star, { shouldDirty: true, shouldValidate: true })}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                disabled={disabled || isSubmitting}
                className="transition-transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span
                  className="material-symbols-outlined text-4xl text-secondary transition-all"
                  style={{
                    fontVariationSettings:
                      (hoverRating || rating) >= star ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  star
                </span>
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-label-md text-primary font-semibold mt-2">
              {rating} out of 5 stars
            </p>
          )}
          {errors.rating && <p className="mt-2 text-label-md font-semibold text-error">{getFieldError(errors.rating)}</p>}
        </div>

        {/* Review Text */}
        <div>
          <label htmlFor="review" className="block text-label-lg font-bold text-on-surface mb-2">
            Your Review (Optional)
          </label>
          <textarea
            id="review"
            {...register('review', {
              maxLength: {
                value: 500,
                message: validationMessages.maxLength('Review', 500),
              },
            })}
            placeholder="Share your thoughts about this course..."
            disabled={disabled || isSubmitting}
            maxLength={500}
            className="w-full px-4 py-3 rounded-lg border-2 border-outline-variant bg-surface-container focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-body-md resize-none"
            rows={4}
          />
          <p className="text-label-sm text-on-surface-variant mt-2">
            {(review || '').length}/500 characters
          </p>
          {errors.review && <p className="mt-2 text-label-md font-semibold text-error">{getFieldError(errors.review)}</p>}
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={disabled || isSubmitting || rating === 0}
            variant="primary"
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Review' : 'Submit Review'}
          </Button>
          {isEditing && (
            <Button
              type="button"
              onClick={handleDelete}
              disabled={disabled || isSubmitting}
              variant="secondary"
            >
              {isSubmitting ? 'Deleting...' : 'Delete Review'}
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
