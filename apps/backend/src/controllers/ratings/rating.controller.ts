import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import ratingService from "../../services/ratings/rating.service.js";
import { created, message, ok, paginated, requireUser } from "../../utils/http.js";
import { parsePagination, parsePositiveInt } from "../../validators/common.validator.js";

export class RatingController {
  async getCourseRatings(req: Request, res: Response) {
    const courseId = parsePositiveInt(req.params.courseId, "course ID");

    const { limit, offset } = parsePagination(req.query, { defaultLimit: 5, maxLimit: 50 });

    const { ratings, average_rating, rating_count } = await ratingService.getCourseRatings(courseId, limit, offset);

    return ok(res, ratings, {
      average_rating,
      rating_count,
    });
  }

  async createRating(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);

    const courseId = parsePositiveInt(req.params.courseId, "course ID");
    const { rating, review } = req.body;
    const newRating = await ratingService.createRating(user.user_id, courseId, rating, review);

    return created(res, "Rating created successfully", newRating);
  }

  async updateRating(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);

    const ratingId = parsePositiveInt(req.params.ratingId, "rating ID");
    const { rating, review } = req.body;
    const updatedRating = await ratingService.updateRating(user.user_id, ratingId, rating, review);

    return ok(res, updatedRating, { message: "Rating updated successfully" });
  }

  async deleteRating(req: AuthenticatedRequest, res: Response) {
    requireUser(req);

    const ratingId = parsePositiveInt(req.params.ratingId, "rating ID");
    await ratingService.deleteRating(ratingId);

    return message(res, "Rating deleted successfully");
  }

  async getTopRatedCourses(req: Request, res: Response) {
    const { limit } = parsePagination(req.query, { defaultLimit: 3, maxLimit: 10 });
    const reviews = await ratingService.getTopRatedCourses(limit);

    return paginated(res, reviews);
  }

  async getLearnerFeedbackTestimonials(req: Request, res: Response) {
    const reviews = await ratingService.getLearnerFeedbackTestimonials();

    return paginated(res, reviews);
  }
}

export default new RatingController();
