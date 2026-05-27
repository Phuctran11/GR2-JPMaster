import databaseService from "../../services/database.service.js";

export class AdminCoursesDeleteModel {
  async deleteCourse(courseId: number, ownerId?: number): Promise<boolean> {
    return databaseService.withTransaction(async (client) => {
      const existing = await client.query(
        `SELECT course_id FROM "Course" WHERE course_id = $1 AND deleted_at IS NULL ${ownerId ? "AND created_by = $2" : ""};`,
        ownerId ? [courseId, ownerId] : [courseId]
      );
      if (!existing.rowCount) {
        return false;
      }

      await client.query(
        `
          UPDATE "Quiz"
          SET deleted_at = COALESCE(deleted_at, NOW()),
              updated_at = NOW()
          WHERE deleted_at IS NULL
            AND (
              course_id = $1
              OR lesson_id IN (SELECT lesson_id FROM "Lesson" WHERE course_id = $1)
            );
        `,
        [courseId]
      );
      await client.query(
        `
          UPDATE "Lesson"
          SET deleted_at = COALESCE(deleted_at, NOW()),
              updated_at = NOW()
          WHERE course_id = $1
            AND deleted_at IS NULL;
        `,
        [courseId]
      );
      await client.query(
        `
          UPDATE "Course"
          SET deleted_at = COALESCE(deleted_at, NOW()),
              updated_at = NOW()
          WHERE course_id = $1
            AND deleted_at IS NULL;
        `,
        [courseId]
      );

      return true;
    });
  }
}

export default new AdminCoursesDeleteModel();
