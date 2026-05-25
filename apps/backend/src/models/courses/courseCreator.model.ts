import databaseService from "../../services/database.service.js";
import { courseBaseSelect, formatCourse, type Course } from "./course.types.js";
import { activeCourseLessonExistsSql } from "./courseVisibility.helpers.js";

export class CourseCreatorModel {
  async getCoursesByCreator(createdBy: number, limit = 10, offset = 0): Promise<Course[]> {
    const result = await databaseService.executeQuery(
      `
        SELECT ${courseBaseSelect}
        FROM "Course" c
        WHERE c.created_by = $1
          AND c.deleted_at IS NULL
          AND ${activeCourseLessonExistsSql("c")}
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3;
      `,
      [createdBy, limit, offset]
    );
    return result.rows.map(formatCourse);
  }
}

export default new CourseCreatorModel();
