import databaseService from "../../services/database.service.js";
import { finalQuizIdSelect, formatCourse, type Course } from "./course.types.js";

export class CourseWriteModel {
  async createCourse(
    title: string,
    description: string | null,
    price: number,
    createdBy: number
  ): Promise<Course> {
    const result = await databaseService.executeQuery(
      `
        WITH created AS (
          INSERT INTO "Course" (title, description, price, level, created_by, created_at, updated_at)
          VALUES ($1, $2, $3, 'beginner', $4, NOW(), NOW())
          RETURNING course_id, title, description, price, level, duration, cover_asset_id, image_url, created_by, created_at, updated_at
        )
        SELECT
          c.course_id, c.title, c.description, c.price, c.level, c.duration, c.cover_asset_id, c.image_url, c.created_by,
          ${finalQuizIdSelect},
          c.created_at, c.updated_at
        FROM created c;
      `,
      [title, description, price, createdBy]
    );
    return formatCourse(result.rows[0]);
  }

  async updateCourse(courseId: number, title: string, description: string | null, price: number): Promise<Course | null> {
    const result = await databaseService.executeQuery(
      `
        WITH updated AS (
          UPDATE "Course"
          SET title = $1, description = $2, price = $3, updated_at = NOW()
          WHERE course_id = $4
            AND deleted_at IS NULL
          RETURNING course_id, title, description, price, level, duration, cover_asset_id, image_url, created_by, created_at, updated_at
        )
        SELECT
          c.course_id, c.title, c.description, c.price, c.level, c.duration, c.cover_asset_id, c.image_url, c.created_by,
          ${finalQuizIdSelect},
          c.created_at, c.updated_at
        FROM updated c;
      `,
      [title, description, price, courseId]
    );
    return result.rows[0] ? formatCourse(result.rows[0]) : null;
  }

  async deleteCourse(courseId: number): Promise<boolean> {
    return databaseService.withTransaction(async (client) => {
      const existing = await client.query(
        `SELECT course_id FROM "Course" WHERE course_id = $1 AND deleted_at IS NULL;`,
        [courseId]
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

export default new CourseWriteModel();

