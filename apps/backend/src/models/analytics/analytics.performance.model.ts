import databaseService from "../../services/database.service.js";

const formatScoreRow = (row: any) => ({
  ...row,
  score: row.score == null ? null : Number(row.score),
  total_marks: row.total_marks == null ? null : Number(row.total_marks),
});

export class AnalyticsPerformanceModel {
  async getQuizPerformance(userId: number) {
    const result = await databaseService.executeQuery(
      `
        SELECT qa.attempt_id, qa.quiz_id, q.title, q.quiz_type, qa.score, qa.total_marks,
               qa.status, qa.started_at, qa.submitted_at
        FROM "QuizAttempt" qa
        JOIN "Quiz" q ON q.quiz_id = qa.quiz_id
        WHERE qa.user_id = $1
          AND qa.quiz_id IS NOT NULL
          AND qa.status IN ('submitted', 'graded')
        ORDER BY qa.submitted_at DESC NULLS LAST, qa.attempt_id DESC
        LIMIT 20;
      `,
      [userId]
    );
    return result.rows.map(formatScoreRow);
  }

  async getJlptPerformance(userId: number) {
    const result = await databaseService.executeQuery(
      `
        SELECT qa.attempt_id, qa.jlpt_exam_id AS exam_id, e.title, e.jlpt_level,
               qa.score, qa.total_marks, qa.status, qa.started_at, qa.submitted_at
        FROM "QuizAttempt" qa
        JOIN "JLPTExam" e ON e.exam_id = qa.jlpt_exam_id
        WHERE qa.user_id = $1
          AND qa.jlpt_exam_id IS NOT NULL
          AND qa.status IN ('submitted', 'graded')
        ORDER BY qa.submitted_at DESC NULLS LAST, qa.attempt_id DESC
        LIMIT 20;
      `,
      [userId]
    );
    return result.rows.map(formatScoreRow);
  }
}

export default new AnalyticsPerformanceModel();
