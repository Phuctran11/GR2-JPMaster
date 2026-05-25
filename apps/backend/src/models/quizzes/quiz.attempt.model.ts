import databaseService from "../../services/database.service.js";
import quizReadModel from "./quiz.read.model.js";
import { formatQuizAttemptSummary, type QuizAttemptSummary } from "./quiz.types.js";

export class QuizAttemptModel {
  async startQuizAttempt(userId: number, quizId: number): Promise<QuizAttemptSummary | null> {
    const quiz = await quizReadModel.getQuizByIdInternal(quizId);
    if (!quiz) {
      return null;
    }

    const result = await databaseService.executeQuery(
      `
        INSERT INTO "QuizAttempt" (user_id, quiz_id, started_at, status)
        VALUES ($1, $2, NOW(), 'in_progress')
        RETURNING attempt_id, quiz_id, score, total_marks, status, started_at, submitted_at;
      `,
      [userId, quizId]
    );

    return formatQuizAttemptSummary(result.rows[0]);
  }
}

export default new QuizAttemptModel();

