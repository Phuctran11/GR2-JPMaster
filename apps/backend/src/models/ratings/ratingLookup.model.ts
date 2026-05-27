import databaseService from "../../services/database.service.js";
import { formatRating, type CourseRating } from "./rating.types.js";

export class RatingLookupModel {
  async getUserCourseRating(userId: number, courseId: number): Promise<CourseRating | null> {
    const result = await databaseService.executeQuery(
      `
        SELECT rating_id, course_id, user_id, rating, review, created_at, updated_at
        FROM "CourseRating"
        WHERE user_id = $1 AND course_id = $2;
      `,
      [userId, courseId]
    );
    return result.rows[0] ? formatRating(result.rows[0]) : null;
  }

  async getRatingById(ratingId: number): Promise<CourseRating | null> {
    const result = await databaseService.executeQuery(
      `
        SELECT rating_id, course_id, user_id, rating, review, created_at, updated_at
        FROM "CourseRating"
        WHERE rating_id = $1;
      `,
      [ratingId]
    );
    return result.rows[0] ? formatRating(result.rows[0]) : null;
  }
}

export default new RatingLookupModel();
