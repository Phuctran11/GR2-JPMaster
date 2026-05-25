import ratingCourseReadModel from "./ratingCourse.read.model.js";
import ratingLookupModel from "./ratingLookup.model.js";
import ratingMarketingModel from "./ratingMarketing.model.js";

export class RatingReadModel {
  getCourseRatings = ratingCourseReadModel.getCourseRatings.bind(ratingCourseReadModel);
  getAverageRating = ratingCourseReadModel.getAverageRating.bind(ratingCourseReadModel);
  getRatingCount = ratingCourseReadModel.getRatingCount.bind(ratingCourseReadModel);
  getRatingSummary = ratingCourseReadModel.getRatingSummary.bind(ratingCourseReadModel);
  getUserCourseRating = ratingLookupModel.getUserCourseRating.bind(ratingLookupModel);
  getRatingById = ratingLookupModel.getRatingById.bind(ratingLookupModel);
  getTopRatedCoursesWithReviews = ratingMarketingModel.getTopRatedCoursesWithReviews.bind(ratingMarketingModel);
  getLearnerFeedbackTestimonials = ratingMarketingModel.getLearnerFeedbackTestimonials.bind(ratingMarketingModel);
}

export default new RatingReadModel();
