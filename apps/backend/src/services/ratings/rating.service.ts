import enrollmentModel from "../../models/enrollments/enrollment.model.js";
import ratingModel from "../../models/ratings/rating.model.js";
import { ApiError } from "../../utils/http.js";

const parseRatingValue = (value: unknown) => {
  const rating = Number(value);
  return Number.isFinite(rating) && rating >= 1 && rating <= 5 ? rating : null;
};

export class RatingService {
  async getCourseRatings(courseId: number, limit: number, offset: number) {
    const [ratings, summary] = await Promise.all([
      ratingModel.getCourseRatings(courseId, limit, offset),
      ratingModel.getRatingSummary(courseId),
    ]);

    return { ratings, average_rating: summary.average_rating, rating_count: summary.rating_count };
  }

  async createRating(userId: number, courseId: number, rating: unknown, review?: string) {
    const ratingValue = parseRatingValue(rating);
    if (!ratingValue) {
      throw new ApiError(400, "Rating must be between 1 and 5");
    }

    const hasAccess = await enrollmentModel.checkUserCourseAccess(userId, courseId);
    if (!hasAccess) {
      throw new ApiError(403, "You must enroll in this course to leave a review");
    }

    const existingRating = await ratingModel.getUserCourseRating(userId, courseId);
    if (existingRating) {
      throw new ApiError(409, "You have already rated this course. Update your existing rating.");
    }

    return ratingModel.createRating(courseId, userId, ratingValue, review);
  }

  async updateRating(userId: number, ratingId: number, rating: unknown, review?: string) {
    const ratingValue = parseRatingValue(rating);
    if (!ratingValue) {
      throw new ApiError(400, "Rating must be between 1 and 5");
    }

    const existingRating = await ratingModel.getRatingById(ratingId);
    if (!existingRating) {
      throw new ApiError(404, "Rating not found");
    }

    if (existingRating.user_id !== userId) {
      throw new ApiError(403, "You can only update your own ratings");
    }

    return ratingModel.updateRating(ratingId, ratingValue, review);
  }

  async deleteRating(ratingId: number) {
    const success = await ratingModel.deleteRating(ratingId);
    if (!success) {
      throw new ApiError(404, "Rating not found");
    }
  }

  async getTopRatedCourses(limit: number) {
    return ratingModel.getTopRatedCoursesWithReviews(limit);
  }

  async getLearnerFeedbackTestimonials() {
    return ratingModel.getLearnerFeedbackTestimonials();
  }
}

export default new RatingService();
