import databaseService from "../../services/database.service.js";
import { formatQuizAttemptSummary, type QuizAttemptState } from "./quiz.types.js";

export class QuizStateModel {
  async getQuizAttemptState(userId: number, quizId: number, passingScore: number): Promise<QuizAttemptState> {
    const result = await databaseService.executeQuery(
      `
        WITH latest_attempt AS (
          SELECT attempt_id, quiz_id, score, total_marks, status, started_at, submitted_at
          FROM "QuizAttempt"
          WHERE user_id = $1
            AND quiz_id = $2
            AND status IN ('submitted', 'graded')
          ORDER BY submitted_at DESC NULLS LAST, attempt_id DESC
          LIMIT 1
        )
        SELECT
          latest_attempt.attempt_id,
          latest_attempt.quiz_id,
          latest_attempt.score,
          latest_attempt.total_marks,
          latest_attempt.status,
          latest_attempt.started_at,
          latest_attempt.submitted_at,
          EXISTS (
            SELECT 1
            FROM "QuizAttempt" qa
            WHERE qa.user_id = $1
              AND qa.quiz_id = $2
              AND qa.status IN ('submitted', 'graded')
              AND qa.score >= $3
          ) AS has_passed
        FROM (SELECT 1) seed
        LEFT JOIN latest_attempt ON TRUE;
      `,
      [userId, quizId, passingScore]
    );

    const row = result.rows[0];
    if (!row?.attempt_id) {
      return { latestAttempt: null, hasPassed: Boolean(row?.has_passed) };
    }

    return {
      latestAttempt: formatQuizAttemptSummary(row, passingScore),
      hasPassed: Boolean(row.has_passed),
    };
  }

  async hasPassedQuiz(userId: number, quizId: number): Promise<boolean> {
    const result = await databaseService.executeQuery(
      `
        SELECT 1
        FROM "QuizAttempt" qa
        JOIN "Quiz" q ON q.quiz_id = qa.quiz_id
        WHERE qa.user_id = $1
          AND qa.quiz_id = $2
          AND q.deleted_at IS NULL
          AND qa.status IN ('submitted', 'graded')
          AND qa.score >= q.passing_score
        LIMIT 1;
      `,
      [userId, quizId]
    );
    return Boolean(result.rows[0]);
  }

  async hasPassedLessonQuiz(userId: number, lessonId: number): Promise<boolean> {
    const quizId = await this.getLatestQuizId("lesson_id", lessonId, "lesson_quiz");
    if (!quizId) return true;
    return this.hasPassedQuiz(userId, quizId);
  }

  async hasPassedFinalQuiz(userId: number, courseId: number): Promise<boolean> {
    const quizId = await this.getLatestQuizId("course_id", courseId, "final_test");
    if (!quizId) return true;
    return this.hasPassedQuiz(userId, quizId);
  }

  private async getLatestQuizId(column: "lesson_id" | "course_id", id: number, quizType: "lesson_quiz" | "final_test") {
    const result = await databaseService.executeQuery(
      `
        SELECT quiz_id
        FROM "Quiz"
        WHERE ${column} = $1
          AND quiz_type = $2
          AND deleted_at IS NULL
        ORDER BY quiz_id DESC
        LIMIT 1;
      `,
      [id, quizType]
    );
    const quizId = result.rows[0]?.quiz_id;
    return quizId == null ? null : Number(quizId);
  }
}

export default new QuizStateModel();
