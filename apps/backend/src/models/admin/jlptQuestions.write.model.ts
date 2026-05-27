import databaseService from "../../services/database.service.js";
import type { AdminQuizQuestionInput, SectionType } from "../admin.model.js";
import {
  insertAdminQuestion,
  updateAdminQuestion,
  validateReadingPassageForSection,
} from "./questionMutation.helpers.js";
import { insertQuestionOptions, replaceQuestionOptions } from "./questionOptions.model.js";
import adminJlptQuestionsReadModel from "./jlptQuestions.read.model.js";

class AdminJlptQuestionsWriteModel {
  async createJlptSectionQuestion(sectionId: number, input: AdminQuizQuestionInput, createdBy: number, ownerId?: number) {
    const questionId = await databaseService.withTransaction(async (client) => {
      const sectionResult = await client.query(
        `
          SELECT s.section_type
          FROM "JLPTSection" s
          JOIN "JLPTExam" e ON e.exam_id = s.exam_id
          WHERE s.section_id = $1
            AND s.deleted_at IS NULL
            AND e.deleted_at IS NULL
            ${ownerId ? "AND e.created_by = $2" : ""};
        `,
        ownerId ? [sectionId, ownerId] : [sectionId]
      );
      if (!sectionResult.rowCount) {
        return null;
      }
      const sectionType = sectionResult.rows[0].section_type as SectionType;
      if (!(await validateReadingPassageForSection(client, sectionType, input.reading_passage_id, ownerId))) {
        return null;
      }

      const createdQuestionId = await insertAdminQuestion(client, input, createdBy, sectionType, {
        audio_asset_id: null,
        audio_url: null,
      });

      await client.query(
        `
          INSERT INTO "JLPTSectionQuestion" (section_id, question_id, order_index)
          VALUES ($1, $2, $3);
        `,
        [sectionId, createdQuestionId, input.order_index ?? null]
      );

      await insertQuestionOptions(client, createdQuestionId, input.options);

      return createdQuestionId;
    });
    return questionId
      ? (await adminJlptQuestionsReadModel.listJlptSectionQuestions(sectionId, ownerId)).find((question) => question.question_id === questionId) ?? null
      : null;
  }

  async updateJlptSectionQuestion(sectionId: number, questionId: number, input: AdminQuizQuestionInput, ownerId?: number) {
    const updated = await databaseService.withTransaction(async (client) => {
      const existing = await client.query(
        `
          SELECT s.section_type
          FROM "JLPTSectionQuestion" jsq
          JOIN "JLPTSection" s ON s.section_id = jsq.section_id
          JOIN "JLPTExam" e ON e.exam_id = s.exam_id
          JOIN "Question" q ON q.question_id = jsq.question_id
          WHERE jsq.section_id = $1
            AND jsq.question_id = $2
            AND jsq.deleted_at IS NULL
            AND s.deleted_at IS NULL
            AND e.deleted_at IS NULL
            AND q.deleted_at IS NULL
            ${ownerId ? "AND e.created_by = $3" : ""};
        `,
        ownerId ? [sectionId, questionId, ownerId] : [sectionId, questionId]
      );
      if (!existing.rowCount) {
        return false;
      }
      const sectionType = existing.rows[0].section_type as SectionType;
      if (!(await validateReadingPassageForSection(client, sectionType, input.reading_passage_id, ownerId))) {
        return false;
      }

      await updateAdminQuestion(client, questionId, input, sectionType, {
        audio_asset_id: null,
        audio_url: null,
      });
      await client.query(
        `UPDATE "JLPTSectionQuestion" SET order_index = $1 WHERE section_id = $2 AND question_id = $3 AND deleted_at IS NULL;`,
        [input.order_index ?? null, sectionId, questionId]
      );

      await replaceQuestionOptions(client, questionId, input.options);

      return true;
    });
    return updated
      ? (await adminJlptQuestionsReadModel.listJlptSectionQuestions(sectionId, ownerId)).find((question) => question.question_id === questionId) ?? null
      : null;
  }

  async updateJlptSectionQuestionOrder(sectionId: number, questionId: number, orderIndex: number | null, ownerId?: number): Promise<boolean> {
    const result = await databaseService.executeQuery(
      `
        UPDATE "JLPTSectionQuestion" jsq
        SET order_index = $1
        FROM "JLPTSection" s, "JLPTExam" e
        WHERE jsq.section_id = s.section_id
          AND s.exam_id = e.exam_id
          AND jsq.section_id = $2
          AND jsq.question_id = $3
          AND jsq.deleted_at IS NULL
          AND s.deleted_at IS NULL
          AND e.deleted_at IS NULL
          ${ownerId ? "AND e.created_by = $4" : ""};
      `,
      ownerId ? [orderIndex, sectionId, questionId, ownerId] : [orderIndex, sectionId, questionId]
    );
    return Boolean(result.rowCount);
  }

  async deleteJlptSectionQuestion(sectionId: number, questionId: number, ownerId?: number): Promise<boolean> {
    const result = await databaseService.executeQuery(
      `
        UPDATE "JLPTSectionQuestion" jsq
        SET deleted_at = COALESCE(jsq.deleted_at, NOW())
        FROM "JLPTSection" s, "JLPTExam" e
        WHERE jsq.section_id = s.section_id
          AND s.exam_id = e.exam_id
          AND jsq.section_id = $1
          AND jsq.question_id = $2
          AND jsq.deleted_at IS NULL
          AND s.deleted_at IS NULL
          AND e.deleted_at IS NULL
          ${ownerId ? "AND e.created_by = $3" : ""};
      `,
      ownerId ? [sectionId, questionId, ownerId] : [sectionId, questionId]
    );
    return Boolean(result.rowCount);
  }
}

export default new AdminJlptQuestionsWriteModel();
