import databaseService from "../../services/database.service.js";
import type { QuizType } from "../admin.model.js";
import { buildUpdateSet } from "./adminModelHelpers.js";

type CreateQuizInput = {
  lesson_id: number | null;
  course_id: number | null;
  title: string;
  description: string | null;
  quiz_type: QuizType;
  passing_score: number;
  total_marks: number;
  time_limit_minutes: number | null;
  created_by: number;
  owner_id?: number;
};

type UpdateQuizInput = Partial<{
  lesson_id: number | null;
  course_id: number | null;
  title: string;
  description: string | null;
  quiz_type: QuizType;
  passing_score: number;
  total_marks: number;
  time_limit_minutes: number | null;
}>;

class AdminQuizzesWriteModel {
  async createQuiz(input: CreateQuizInput) {
    const result = await databaseService.executeQuery(
      `
        INSERT INTO "Quiz" (lesson_id, course_id, title, description, quiz_type, passing_score, total_marks, time_limit_minutes, created_by, created_at, updated_at)
        SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
        WHERE (
          $10::int IS NULL
          OR (
            ($1::int IS NULL OR EXISTS (
              SELECT 1
              FROM "Lesson" l
              JOIN "Course" lc ON lc.course_id = l.course_id
              WHERE l.lesson_id = $1 AND l.deleted_at IS NULL AND lc.deleted_at IS NULL AND lc.created_by = $10
            ))
            AND ($2::int IS NULL OR EXISTS (
              SELECT 1 FROM "Course" c WHERE c.course_id = $2 AND c.deleted_at IS NULL AND c.created_by = $10
            ))
          )
        )
        RETURNING quiz_id, lesson_id, course_id, title, description, quiz_type, passing_score, total_marks, time_limit_minutes, created_by, created_at, updated_at;
      `,
      [
        input.lesson_id,
        input.course_id,
        input.title,
        input.description,
        input.quiz_type,
        input.passing_score,
        input.total_marks,
        input.time_limit_minutes,
        input.created_by,
        input.owner_id ?? null,
      ]
    );
    return result.rows[0] || null;
  }

  async updateQuiz(quizId: number, input: UpdateQuizInput, ownerId?: number) {
    if (ownerId && (input.lesson_id !== undefined || input.course_id !== undefined)) {
      const accessResult = await databaseService.executeQuery(
        `
          SELECT
            ($1::int IS NULL OR EXISTS (
              SELECT 1
              FROM "Lesson" l
              JOIN "Course" lc ON lc.course_id = l.course_id
              WHERE l.lesson_id = $1 AND l.deleted_at IS NULL AND lc.deleted_at IS NULL AND lc.created_by = $3
            )) AS lesson_ok,
            ($2::int IS NULL OR EXISTS (
              SELECT 1 FROM "Course" c WHERE c.course_id = $2 AND c.deleted_at IS NULL AND c.created_by = $3
            )) AS course_ok;
        `,
        [input.lesson_id ?? null, input.course_id ?? null, ownerId]
      );
      if (!accessResult.rows[0]?.lesson_ok || !accessResult.rows[0]?.course_ok) return null;
    }

    const fields = ["lesson_id", "course_id", "title", "description", "quiz_type", "passing_score", "total_marks", "time_limit_minutes"] as const;
    const { updates, values } = buildUpdateSet(input, fields);

    if (!updates.length) return null;
    values.push(quizId);
    if (ownerId) values.push(ownerId);
    const result = await databaseService.executeQuery(
      `
        UPDATE "Quiz"
        SET ${updates.join(", ")}, updated_at = NOW()
        WHERE quiz_id = $${ownerId ? values.length - 1 : values.length}
          AND deleted_at IS NULL
          ${ownerId ? `AND created_by = $${values.length}` : ""}
        RETURNING quiz_id, lesson_id, course_id, title, description, quiz_type, passing_score, total_marks, time_limit_minutes, created_by, created_at, updated_at;
      `,
      values
    );
    return result.rows[0] || null;
  }

  async deleteQuiz(quizId: number, ownerId?: number): Promise<boolean> {
    const result = await databaseService.executeQuery(
      `
        UPDATE "Quiz"
        SET deleted_at = COALESCE(deleted_at, NOW()),
            updated_at = NOW()
        WHERE quiz_id = $1
          AND deleted_at IS NULL
          ${ownerId ? "AND created_by = $2" : ""};
      `,
      ownerId ? [quizId, ownerId] : [quizId]
    );
    return Boolean(result.rowCount);
  }
}

export default new AdminQuizzesWriteModel();
