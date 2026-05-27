import databaseService from "../../services/database.service.js";

export class AdminLessonsDeleteModel {
  async deleteLesson(lessonId: number, ownerId?: number): Promise<boolean> {
    return databaseService.withTransaction(async (client) => {
      const existing = await client.query(
        `
          SELECT l.lesson_id
          FROM "Lesson" l
          JOIN "Course" c ON c.course_id = l.course_id
          WHERE l.lesson_id = $1
            AND l.deleted_at IS NULL
            AND c.deleted_at IS NULL
            ${ownerId ? "AND c.created_by = $2" : ""};
        `,
        ownerId ? [lessonId, ownerId] : [lessonId]
      );
      if (!existing.rowCount) {
        return false;
      }

      await client.query(
        `
          UPDATE "Quiz"
          SET deleted_at = COALESCE(deleted_at, NOW()),
              updated_at = NOW()
          WHERE lesson_id = $1
            AND deleted_at IS NULL;
        `,
        [lessonId]
      );
      await client.query(
        `
          UPDATE "Lesson"
          SET deleted_at = COALESCE(deleted_at, NOW()),
              updated_at = NOW()
          WHERE lesson_id = $1
            AND deleted_at IS NULL;
        `,
        [lessonId]
      );

      return true;
    });
  }
}

export default new AdminLessonsDeleteModel();
