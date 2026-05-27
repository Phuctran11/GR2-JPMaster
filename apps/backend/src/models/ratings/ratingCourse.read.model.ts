import databaseService from "../../services/database.service.js";
import { formatRating, type CourseRatingWithUser, type RatingSummary } from "./rating.types.js";

export class RatingCourseReadModel {
  async getCourseRatings(courseId: number, limit = 10, offset = 0): Promise<CourseRatingWithUser[]> {
    const result = await databaseService.executeQuery(
      `
        SELECT cr.rating_id, cr.course_id, cr.user_id, cr.rating, cr.review, cr.created_at, cr.updated_at, u.username
        FROM "CourseRating" cr
        JOIN "User" u ON cr.user_id = u.user_id
        WHERE cr.course_id = $1
        ORDER BY cr.created_at DESC
        LIMIT $2 OFFSET $3;
      `,
      [courseId, limit, offset]
    );
    return result.rows.map((row) => ({
      ...formatRating(row),
      username: row.username,
    }));
  }

  async getAverageRating(courseId: number): Promise<number> {
    const result = await databaseService.executeQuery(
      `
        SELECT AVG(rating) as average_rating
        FROM "CourseRating"
        WHERE course_id = $1;
      `,
      [courseId]
    );
    const average = result.rows[0]?.average_rating;
    return average ? Number(average) : 0;
  }

  async getRatingCount(courseId: number): Promise<number> {
    const result = await databaseService.executeQuery(
      `
        SELECT COUNT(*) as count
        FROM "CourseRating"
        WHERE course_id = $1;
      `,
      [courseId]
    );
    return Number(result.rows[0]?.count || 0);
  }

  async getRatingSummary(courseId: number): Promise<RatingSummary> {
    const result = await databaseService.executeQuery(
      `
        SELECT
          COALESCE(AVG(rating), 0) AS average_rating,
          COUNT(*)::int AS rating_count
        FROM "CourseRating"
        WHERE course_id = $1;
      `,
      [courseId]
    );
    return {
      average_rating: Number(result.rows[0]?.average_rating || 0),
      rating_count: Number(result.rows[0]?.rating_count || 0),
    };
  }
}

export default new RatingCourseReadModel();
