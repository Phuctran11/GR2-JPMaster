import databaseService from "../../services/database.service.js";
import { getOptionsByQuestionIds } from "./questionOptions.model.js";

class AdminQuizQuestionsReadModel {
  async listQuizQuestions(quizId: number, ownerId?: number) {
    const questionResult = await databaseService.executeQuery(
      `
        SELECT q.question_id, q.question_text, q.question_type, q.difficulty_level, q.explanation,
               q.points, q.jlpt_level, q.section_type, q.reading_passage_id,
               rp.title AS reading_passage_title, rp.passage_text AS reading_passage_text, rp.image_url AS reading_passage_image_url,
               q.image_asset_id, q.image_url, q.audio_asset_id, q.audio_url,
               qq.order_index, COALESCE(qq.marks, q.points, 1) AS marks
        FROM "QuizQuestion" qq
        JOIN "Question" q ON q.question_id = qq.question_id
        JOIN "Quiz" quiz ON quiz.quiz_id = qq.quiz_id
        LEFT JOIN "ReadingPassage" rp ON rp.passage_id = q.reading_passage_id AND rp.deleted_at IS NULL
        WHERE qq.quiz_id = $1
          AND quiz.deleted_at IS NULL
          ${ownerId ? "AND quiz.created_by = $2" : ""}
          AND qq.deleted_at IS NULL
          AND q.deleted_at IS NULL
        ORDER BY qq.order_index ASC NULLS LAST, qq.quiz_question_id ASC;
      `,
      ownerId ? [quizId, ownerId] : [quizId]
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

export default new AdminQuizQuestionsReadModel();
