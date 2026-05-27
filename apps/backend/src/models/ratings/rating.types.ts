export interface CourseRating {
  rating_id: number;
  course_id: number;
  user_id: number;
  rating: number;
  review: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CourseRatingWithUser extends CourseRating {
  username?: string;
}

export interface RatingSummary {
  average_rating: number;
  rating_count: number;
}

export type TopRatedCourseReview = {
  course_id: number;
  course_title: string;
  average_rating: number;
  rating_count: number;
  rating_id: number;
  user_id: number;
  username: string;
  rating: number;
  review: string | null;
  created_at: Date;
};

export type LearnerFeedbackTestimonial = TopRatedCourseReview & {
  review: string;
  updated_at: Date;
  activity_at: Date;
};

export const formatRating = (row: any): CourseRating => ({
  ...row,
  rating: Number(row.rating),
});

