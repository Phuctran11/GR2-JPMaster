import databaseService from "../../services/database.service.js";
import type { AutoJlptSectionQuestionsInput, JlptLevel, SectionType } from "../admin.model.js";
import {
  buildRequestedDifficultyCounts,
  countRequestedQuestions,
  isAutoSupportedJlptSection,
} from "./jlptQuestions.auto.helpers.js";
import { findAutoJlptQuestionCandidates } from "./jlptQuestions.autoCandidates.model.js";
import type { AutoJlptQuestionShortage } from "./jlptQuestions.auto.types.js";
import adminJlptQuestionsReadModel from "./jlptQuestions.read.model.js";

class AdminJlptQuestionsAutoModel {
  async autoAddJlptSectionQuestions(sectionId: number, input: AutoJlptSectionQuestionsInput, ownerId?: number) {
    const requested = buildRequestedDifficultyCounts(input);

    if (!requested.length) {
      return { status: "invalid" as const, error: "At least one difficulty count is required" };
    }

    const result = await databaseService.withTransaction(async (client) => {
      const sectionResult = await client.query(
        `
          SELECT s.section_id, s.section_type, e.jlpt_level
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
        return { status: "not_found" as const };
      }

      const section = sectionResult.rows[0] as { section_type: SectionType; jlpt_level: JlptLevel };
      if (!isAutoSupportedJlptSection(section.section_type)) {
        return { status: "unsupported_section" as const };
      }

      const jlptLevel = input.jlpt_level ?? section.jlpt_level;
      const selectedQuestionIds: number[] = [];
      const shortages: AutoJlptQuestionShortage[] = [];

      for (const item of requested) {
        const candidateQuestionIds = await findAutoJlptQuestionCandidates(client, {
          sectionId,
          sectionType: section.section_type,
          jlptLevel,
          difficulty: item.difficulty,
          limit: item.count,
          excludedQuestionIds: selectedQuestionIds,
          ownerId,
        });

        const availableCount = candidateQuestionIds.length;
        if (availableCount < item.count) {
          shortages.push({ difficulty: item.difficulty, requested: item.count, available: availableCount });
        }

        selectedQuestionIds.push(...candidateQuestionIds);
      }

      if (shortages.length) {
        return { status: "insufficient" as const, shortages };
      }

      const orderResult = await client.query(
        `
          SELECT COALESCE(MAX(order_index), 0)::int AS max_order
          FROM "JLPTSectionQuestion"
          WHERE section_id = $1
            AND deleted_at IS NULL;
        `,
        [sectionId]
      );
      let nextOrder = Number(orderResult.rows[0]?.max_order || 0) + 1;

      if (selectedQuestionIds.length > 0) {
        const orderIndexes = selectedQuestionIds.map(() => {
          const orderIndex = nextOrder;
          nextOrder += 1;
          return orderIndex;
        });
        await client.query(
          `
            INSERT INTO "JLPTSectionQuestion" (section_id, question_id, order_index)
            SELECT $1, question_id, order_index
            FROM UNNEST($2::int[], $3::int[]) AS section_questions(question_id, order_index);
          `,
          [sectionId, selectedQuestionIds, orderIndexes]
        );
      }

      return {
        status: "created" as const,
        added_count: selectedQuestionIds.length,
        requested_count: countRequestedQuestions(requested),
      };
    });

    return result.status === "created"
      ? { ...result, questions: await adminJlptQuestionsReadModel.listJlptSectionQuestions(sectionId, ownerId) }
      : result;
  }
}

export default new AdminJlptQuestionsAutoModel();
