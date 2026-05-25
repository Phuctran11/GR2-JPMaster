import ratingReadModel from "./rating.read.model.js";
import type {
  CourseRating,
  CourseRatingWithUser,
  LearnerFeedbackTestimonial,
  RatingSummary,
  TopRatedCourseReview,
} from "./rating.types.js";
import ratingWriteModel from "./rating.write.model.js";

export type {
  CourseRating,
  CourseRatingWithUser,
  LearnerFeedbackTestimonial,
  RatingSummary,
  TopRatedCourseReview,
};

export class RatingModel {
  getCourseRatings = ratingReadModel.getCourseRatings.bind(ratingReadModel);
  getAverageRating = ratingReadModel.getAverageRating.bind(ratingReadModel);
  getRatingCount = ratingReadModel.getRatingCount.bind(ratingReadModel);
  getRatingSummary = ratingReadModel.getRatingSummary.bind(ratingReadModel);
  getUserCourseRating = ratingReadModel.getUserCourseRating.bind(ratingReadModel);
  getRatingById = ratingReadModel.getRatingById.bind(ratingReadModel);
  getTopRatedCoursesWithReviews = ratingReadModel.getTopRatedCoursesWithReviews.bind(ratingReadModel);
  getLearnerFeedbackTestimonials = ratingReadModel.getLearnerFeedbackTestimonials.bind(ratingReadModel);

  createRating = ratingWriteModel.createRating.bind(ratingWriteModel);
  updateRating = ratingWriteModel.updateRating.bind(ratingWriteModel);
  deleteRating = ratingWriteModel.deleteRating.bind(ratingWriteModel);
}

export default new RatingModel();

