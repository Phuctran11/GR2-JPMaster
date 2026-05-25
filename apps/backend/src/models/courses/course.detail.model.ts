import databaseService from "../../services/database.service.js";
import { logger } from "../../utils/logger.js";
import ratingModel from "../ratings/rating.model.js";
import { activeCourseLessonExistsSql } from "./courseVisibility.helpers.js";
import {
  courseBaseSelectWithCreator,
  formatCourse,
  formatCourseWithLessons,
  lessonSelect,
  type Course,
  type CourseDetail,
  type CourseWithLessons,
  type Lesson,
} from "./course.types.js";

export class CourseDetailModel {
  async getCourseById(courseId: number): Promise<Course | null> {
    const result = await databaseService.executeQuery(
      `
        SELECT ${courseBaseSelectWithCreator}
        FROM "Course" c
        LEFT JOIN "User" u ON u.user_id = c.created_by
        WHERE c.course_id = $1
          AND c.deleted_at IS NULL
          AND ${activeCourseLessonExistsSql("c")};
      `,
      [courseId]
    );
    return result.rows[0] ? formatCourse(result.rows[0]) : null;
  }

  async getCourseByIdWithLessons(courseId: number): Promise<CourseWithLessons | null> {
    const result = await databaseService.executeQuery(
      `
        SELECT ${courseBaseSelectWithCreator}
        FROM "Course" c
        LEFT JOIN "User" u ON u.user_id = c.created_by
        WHERE c.course_id = $1
          AND c.deleted_at IS NULL
          AND ${activeCourseLessonExistsSql("c")};
      `,
      [courseId]
    );
    if (!result.rows[0]) return null;

    const lessonsResult = await databaseService.executeQuery(
      `
        SELECT ${lessonSelect}
        FROM "Lesson" l
        WHERE l.course_id = $1
          AND l.deleted_at IS NULL
        ORDER BY l.order_index ASC;
      `,
      [courseId]
    );

    return formatCourseWithLessons(result.rows[0], lessonsResult.rows);
  }

  async getCourseByIdWithDetail(courseId: number): Promise<CourseDetail | null> {
    const course = await this.getCourseByIdWithLessons(courseId);
    if (!course) return null;

    try {
      const [ratings, ratingSummary] = await Promise.all([
        ratingModel.getCourseRatings(courseId, 5, 0),
        ratingModel.getRatingSummary(courseId),
      ]);

      return {
        ...course,
        ratings: ratings.map((rating) => ({
          rating_id: rating.rating_id,
          user_id: rating.user_id,
          username: rating.username,
          rating: rating.rating,
          review: rating.review,
          created_at: rating.created_at,
        })),
        average_rating: ratingSummary.average_rating,
        rating_count: ratingSummary.rating_count,
      };
    } catch (error) {
      logger.error("Failed to load course ratings", { context: "course.detail.model", courseId, error });
      return course;
    }
  }
}

export default new CourseDetailModel();
