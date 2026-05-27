import databaseService from "../../services/database.service.js";
import { formatRating, type CourseRating } from "./rating.types.js";

export class RatingWriteModel {
  async createRating(
    courseId: number,
    userId: number,
    rating: number,
    review?: string
  ): Promise<CourseRating> {
    const result = await databaseService.executeQuery(
      `
        INSERT INTO "CourseRating" (course_id, user_id, rating, review, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING rating_id, course_id, user_id, rating, review, created_at, updated_at;
      `,
      [courseId, userId, rating, review || null]
    );
    return formatRating(result.rows[0]);
  }

  async updateRating(ratingId: number, rating: number, review?: string): Promise<CourseRating | null> {
    const result = await databaseService.executeQuery(
      `
        UPDATE "CourseRating"
        SET rating = $1, review = $2, updated_at = NOW()
        WHERE rating_id = $3
        RETURNING rating_id, course_id, user_id, rating, review, created_at, updated_at;
      `,
      [rating, review || null, ratingId]
    );
    return result.rows[0] ? formatRating(result.rows[0]) : null;
  }

  async deleteRating(ratingId: number): Promise<boolean> {
    const result = await databaseService.executeQuery(
      `DELETE FROM "CourseRating" WHERE rating_id = $1;`,
      [ratingId]
    );
    return (result.rowCount ?? 0) > 0;
  }
}

export default new RatingWriteModel();

