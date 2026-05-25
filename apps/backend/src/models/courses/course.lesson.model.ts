import databaseService from "../../services/database.service.js";
import { lessonSelect, type Lesson } from "./course.types.js";

export class CourseLessonModel {
  async getFirstLessonByCourseId(courseId: number): Promise<Lesson | null> {
    const result = await databaseService.executeQuery(
      `
        SELECT ${lessonSelect}
        FROM "Lesson" l
        WHERE l.course_id = $1
          AND l.deleted_at IS NULL
        ORDER BY l.order_index ASC
        LIMIT 1;
      `,
      [courseId]
    );
    return result.rows[0] || null;
  }

  async getLessonByCourseAndLessonId(courseId: number, lessonId: number): Promise<Lesson | null> {
    const result = await databaseService.executeQuery(
      `
        SELECT ${lessonSelect}
        FROM "Lesson" l
        WHERE l.course_id = $1
          AND l.lesson_id = $2
          AND l.deleted_at IS NULL
        LIMIT 1;
      `,
      [courseId, lessonId]
    );
    return result.rows[0] || null;
  }
}

export default new CourseLessonModel();

