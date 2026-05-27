import databaseService from "../../services/database.service.js";
import { gradeQuiz } from "./quiz.grading.js";
import quizReadModel from "./quiz.read.model.js";
import { insertQuizUserAnswers, upsertGradedQuizAttempt } from "./quizSubmit.persistence.js";
import type { QuizAnswerInput } from "./quiz.types.js";

export class QuizSubmitModel {
  async submitQuiz(userId: number, quizId: number, answers: QuizAnswerInput[], attemptId?: number) {
    const quiz = await quizReadModel.getQuizByIdInternal(quizId);
    if (!quiz) {
      return null;
    }

    const { earnedMarks, totalMarks, score, passed, gradedAnswers } = gradeQuiz(quiz, answers);

    return databaseService.withTransaction(async (client) => {
      const attempt = await upsertGradedQuizAttempt(client, { userId, quizId, score, totalMarks, attemptId });
      await insertQuizUserAnswers(client, attempt.attempt_id, gradedAnswers);

      return {
        attempt_id: attempt.attempt_id,
        quiz_id: attempt.quiz_id,
        score,
        total_marks: totalMarks,
        earned_marks: earnedMarks,
        passing_score: quiz.passing_score,
        passed,
        submitted_at: attempt.submitted_at,
        question_results: gradedAnswers.map((gradedAnswer) => ({
          question_id: gradedAnswer.question.question_id,
          is_correct: gradedAnswer.isCorrect,
          explanation: gradedAnswer.question.explanation,
          selected_option_ids: gradedAnswer.selectedOptionIds,
          correct_option_ids: gradedAnswer.question.options
            .filter((option) => option.is_correct)
            .map((option) => option.option_id)
            .sort((a, b) => a - b),
          answer_text: gradedAnswer.answer?.answer_text ?? null,
        })),
      };
    });
  }
}

export default new QuizSubmitModel();
