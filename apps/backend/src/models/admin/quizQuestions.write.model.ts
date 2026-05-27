import databaseService from "../../services/database.service.js";
import type { AdminQuizQuestionInput } from "../admin.model.js";
import {
  insertAdminQuestion,
  recalculateQuizTotalMarks,
  updateAdminQuestion,
  validateReadingPassageForSection,
} from "./questionMutation.helpers.js";
import { insertQuestionOptions, replaceQuestionOptions } from "./questionOptions.model.js";
import adminQuizQuestionsReadModel from "./quizQuestions.read.model.js";

class AdminQuizQuestionsWriteModel {
  async createQuizQuestion(quizId: number, input: AdminQuizQuestionInput, createdBy: number, ownerId?: number) {
    const questionId = await databaseService.withTransaction(async (client) => {
      const quizExists = await client.query(
        `SELECT quiz_type FROM "Quiz" WHERE quiz_id = $1 AND deleted_at IS NULL ${ownerId ? "AND created_by = $2" : ""};`,
        ownerId ? [quizId, ownerId] : [quizId]
      );
      if (!quizExists.rowCount) {
        return null;
      }

      if (!(await validateReadingPassageForSection(client, input.section_type, input.reading_passage_id, ownerId))) {
        return null;
      }

      const createdQuestionId = await insertAdminQuestion(client, input, createdBy, input.section_type);

      await client.query(
        `
          INSERT INTO "QuizQuestion" (quiz_id, question_id, order_index, marks)
          VALUES ($1, $2, $3, $4);
        `,
        [quizId, createdQuestionId, input.order_index ?? null, input.marks]
      );

      await insertQuestionOptions(client, createdQuestionId, input.options);

      await recalculateQuizTotalMarks(client, quizId);
      return createdQuestionId;
    });
    return questionId
      ? (await adminQuizQuestionsReadModel.listQuizQuestions(quizId, ownerId)).find((question) => question.question_id === questionId) ?? null
      : null;
  }

  async updateQuizQuestion(quizId: number, questionId: number, input: AdminQuizQuestionInput, ownerId?: number) {
    const updated = await databaseService.withTransaction(async (client) => {
      const existing = await client.query(
        `
          SELECT 1
          FROM "QuizQuestion" qq
          JOIN "Quiz" q ON q.quiz_id = qq.quiz_id
          JOIN "Question" qst ON qst.question_id = qq.question_id
          WHERE qq.quiz_id = $1
            AND qq.question_id = $2
            AND qq.deleted_at IS NULL
            AND qst.deleted_at IS NULL
            AND q.deleted_at IS NULL
            ${ownerId ? "AND q.created_by = $3" : ""};
        `,
        ownerId ? [quizId, questionId, ownerId] : [quizId, questionId]
      );
      if (!existing.rowCount) {
        return false;
      }

      if (!(await validateReadingPassageForSection(client, input.section_type, input.reading_passage_id, ownerId))) {
        return false;
      }

      await updateAdminQuestion(client, questionId, input, input.section_type);
      await client.query(
        `UPDATE "QuizQuestion" SET order_index = $1, marks = $2 WHERE quiz_id = $3 AND question_id = $4 AND deleted_at IS NULL;`,
        [input.order_index ?? null, input.marks, quizId, questionId]
      );

      await replaceQuestionOptions(client, questionId, input.options);

      await recalculateQuizTotalMarks(client, quizId);
      return true;
    });
    return updated
      ? (await adminQuizQuestionsReadModel.listQuizQuestions(quizId, ownerId)).find((question) => question.question_id === questionId) ?? null
      : null;
  }

  async updateQuizQuestionOrder(quizId: number, questionId: number, orderIndex: number | null, ownerId?: number): Promise<boolean> {
    const result = await databaseService.executeQuery(
      `
        UPDATE "QuizQuestion" qq
        SET order_index = $1
        FROM "Quiz" q
        WHERE qq.quiz_id = q.quiz_id
          AND qq.quiz_id = $2
          AND qq.question_id = $3
          AND qq.deleted_at IS NULL
          AND q.deleted_at IS NULL
          ${ownerId ? "AND q.created_by = $4" : ""};
      `,
      ownerId ? [orderIndex, quizId, questionId, ownerId] : [orderIndex, quizId, questionId]
    );
    return Boolean(result.rowCount);
  }

  async deleteQuizQuestion(quizId: number, questionId: number, ownerId?: number): Promise<boolean> {
    return databaseService.withTransaction(async (client) => {
      const existing = await client.query(
        `
          SELECT 1
          FROM "QuizQuestion" qq
          JOIN "Quiz" q ON q.quiz_id = qq.quiz_id
          JOIN "Question" qst ON qst.question_id = qq.question_id
          WHERE qq.quiz_id = $1
            AND qq.question_id = $2
            AND qq.deleted_at IS NULL
            AND qst.deleted_at IS NULL
            AND q.deleted_at IS NULL
            ${ownerId ? "AND q.created_by = $3" : ""};
        `,
        ownerId ? [quizId, questionId, ownerId] : [quizId, questionId]
      );
      if (!existing.rowCount) {
        return false;
      }

      await client.query(
        `
          UPDATE "QuizQuestion"
          SET deleted_at = COALESCE(deleted_at, NOW())
          WHERE quiz_id = $1
            AND question_id = $2
            AND deleted_at IS NULL;
        `,
        [quizId, questionId]
      );
      await recalculateQuizTotalMarks(client, quizId);
      return true;
    });
  }
}

export default new AdminQuizQuestionsWriteModel();
