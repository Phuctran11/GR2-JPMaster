import databaseService from "../../services/database.service.js";
import { getOptionsByQuestionIds } from "./questionOptions.model.js";

class AdminJlptQuestionsReadModel {
  async listJlptSectionQuestions(sectionId: number, ownerId?: number) {
    const questionResult = await databaseService.executeQuery(
      `
        SELECT q.question_id, q.question_text, q.question_type, q.difficulty_level, q.explanation,
               q.points, q.jlpt_level, q.section_type, q.reading_passage_id,
               rp.title AS reading_passage_title, rp.passage_text AS reading_passage_text, rp.image_url AS reading_passage_image_url,
               q.image_asset_id, q.image_url, q.audio_asset_id, q.audio_url,
               jsq.order_index, COALESCE(q.points, 1) AS marks
        FROM "JLPTSectionQuestion" jsq
        JOIN "Question" q ON q.question_id = jsq.question_id
        JOIN "JLPTSection" s ON s.section_id = jsq.section_id
        JOIN "JLPTExam" e ON e.exam_id = s.exam_id
        LEFT JOIN "ReadingPassage" rp ON rp.passage_id = q.reading_passage_id AND rp.deleted_at IS NULL
        WHERE jsq.section_id = $1
          AND jsq.deleted_at IS NULL
          AND q.deleted_at IS NULL
          AND s.deleted_at IS NULL
          AND e.deleted_at IS NULL
          ${ownerId ? "AND e.created_by = $2" : ""}
        ORDER BY jsq.order_index ASC NULLS LAST, jsq.id ASC;
      `,
      ownerId ? [sectionId, ownerId] : [sectionId]
    );
    const questionIds = questionResult.rows.map((row) => row.question_id);
    const optionsByQuestion = await getOptionsByQuestionIds(questionIds);

    return questionResult.rows.map((row) => ({
      ...row,
      points: Number(row.points),
      marks: Number(row.marks),
      options: optionsByQuestion.get(row.question_id) ?? [],
    }));
  }
}

export default new AdminJlptQuestionsReadModel();
