import databaseService from "../../services/database.service.js";
import quizDetailModel from "./quiz.detail.model.js";
import type { QuizDetail } from "./quiz.types.js";

export class QuizLookupModel {
  async getQuizCourseId(quizId: number): Promise<number | null> {
    const result = await databaseService.executeQuery(
      `
        SELECT COALESCE(q.course_id, l.course_id) AS course_id
        FROM "Quiz" q
        LEFT JOIN "Lesson" l ON l.lesson_id = q.lesson_id AND l.deleted_at IS NULL
        WHERE q.quiz_id = $1
          AND q.deleted_at IS NULL;
      `,
      [quizId]
    );
    const courseId = result.rows[0]?.course_id;
    return courseId == null ? null : Number(courseId);
  }

  async getLessonCourseId(lessonId: number): Promise<number | null> {
    const result = await databaseService.executeQuery(
      `
        SELECT course_id
        FROM "Lesson"
        WHERE lesson_id = $1
          AND deleted_at IS NULL;
      `,
      [lessonId]
    );
    const courseId = result.rows[0]?.course_id;
    return courseId == null ? null : Number(courseId);
  }

  async getLessonQuiz(lessonId: number, userId: number): Promise<QuizDetail | null> {
    const result = await databaseService.executeQuery(
      `
        SELECT quiz_id
        FROM "Quiz"
        WHERE lesson_id = $1
          AND quiz_type = 'lesson_quiz'
          AND deleted_at IS NULL
        ORDER BY quiz_id DESC
        LIMIT 1;
      `,
      [lessonId]
    );
    const quizId = result.rows[0]?.quiz_id;
    if (!quizId) return null;
    return quizDetailModel.getPublicQuizById(Number(quizId), userId);
  }

  async getFinalQuiz(courseId: number, userId: number): Promise<QuizDetail | null> {
    const result = await databaseService.executeQuery(
      `
        SELECT quiz_id
        FROM "Quiz"
        WHERE course_id = $1
          AND quiz_type = 'final_test'
          AND deleted_at IS NULL
        ORDER BY quiz_id DESC
        LIMIT 1;
      `,
      [courseId]
    );
    const quizId = result.rows[0]?.quiz_id;
    if (!quizId) return null;
    return quizDetailModel.getPublicQuizById(Number(quizId), userId);
  }
}

export default new QuizLookupModel();
