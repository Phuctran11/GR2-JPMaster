import databaseService from "../../services/database.service.js";
import type { LearnerFeedbackTestimonial, TopRatedCourseReview } from "./rating.types.js";

const formatCourseReview = <T extends { rating: unknown; average_rating: unknown; rating_count: unknown }>(row: T) => ({
  ...row,
  rating: Number(row.rating),
  average_rating: Number(row.average_rating),
  rating_count: Number(row.rating_count),
});

export class RatingMarketingModel {
  async getTopRatedCoursesWithReviews(limit = 3): Promise<TopRatedCourseReview[]> {
    const result = await databaseService.executeQuery(
      `
        WITH course_ranking AS (
          SELECT
            c.course_id,
            c.title AS course_title,
            AVG(cr.rating) AS average_rating,
            COUNT(cr.rating_id) AS rating_count
          FROM "Course" c
          JOIN "CourseRating" cr ON c.course_id = cr.course_id
          GROUP BY c.course_id, c.title
        ),
        newest_course_reviews AS (
          SELECT
            cr.rating_id,
            cr.course_id,
            cr.user_id,
            u.username,
            cr.rating,
            cr.review,
            cr.created_at,
            ROW_NUMBER() OVER (
              PARTITION BY cr.course_id
              ORDER BY cr.created_at DESC, cr.rating_id DESC
            ) AS row_number
          FROM "CourseRating" cr
          JOIN "User" u ON cr.user_id = u.user_id
        )
        SELECT
          course_ranking.course_id,
          course_ranking.course_title,
          course_ranking.average_rating,
          course_ranking.rating_count,
          newest_course_reviews.rating_id,
          newest_course_reviews.user_id,
          newest_course_reviews.username,
          newest_course_reviews.rating,
          newest_course_reviews.review,
          newest_course_reviews.created_at
        FROM course_ranking
        JOIN newest_course_reviews
          ON newest_course_reviews.course_id = course_ranking.course_id
          AND newest_course_reviews.row_number = 1
        ORDER BY
          course_ranking.average_rating DESC,
          newest_course_reviews.created_at DESC,
          course_ranking.rating_count DESC,
          course_ranking.course_id ASC
        LIMIT $1;
      `,
      [limit]
    );
    return result.rows.map(formatCourseReview);
  }

  async getLearnerFeedbackTestimonials(): Promise<LearnerFeedbackTestimonial[]> {
    const result = await databaseService.executeQuery(
      `
        WITH course_ranking AS (
          SELECT
            c.course_id,
            c.title AS course_title,
            AVG(cr.rating) AS average_rating,
            COUNT(cr.rating_id) AS rating_count
          FROM "Course" c
          JOIN "CourseRating" cr ON c.course_id = cr.course_id
          GROUP BY c.course_id, c.title
        )
        SELECT
          cr.course_id,
          course_ranking.course_title,
          course_ranking.average_rating,
          course_ranking.rating_count,
          cr.rating_id,
          cr.user_id,
          u.username,
          cr.rating,
          cr.review,
          cr.created_at,
          cr.updated_at,
          GREATEST(cr.created_at, COALESCE(cr.updated_at, cr.created_at)) AS activity_at
        FROM "CourseRating" cr
        JOIN "User" u ON cr.user_id = u.user_id
        JOIN course_ranking ON course_ranking.course_id = cr.course_id
        WHERE cr.rating > 4
          AND cr.review IS NOT NULL
          AND BTRIM(cr.review) <> ''
        ORDER BY
          activity_at DESC,
          cr.rating DESC,
          course_ranking.average_rating DESC,
          course_ranking.rating_count DESC,
          cr.rating_id DESC;
      `
    );
    return result.rows.map(formatCourseReview);
  }
}

export default new RatingMarketingModel();
