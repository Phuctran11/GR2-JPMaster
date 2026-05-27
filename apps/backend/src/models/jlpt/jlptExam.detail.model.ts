import databaseService from "../../services/database.service.js";

class JlptExamDetailModel {
  async getExamById(examId: number) {
    const examResult = await databaseService.executeQuery(
      `
        SELECT exam_id, title, jlpt_level, year, duration_minutes, created_at
        FROM "JLPTExam"
        WHERE exam_id = $1
          AND deleted_at IS NULL;
      `,
      [examId]
    );
    const exam = examResult.rows[0];
    if (!exam) return null;

    const sectionResult = await databaseService.executeQuery(
      `
        SELECT section_id, exam_id, title, section_type, section_order, duration_minutes, audio_url
        FROM "JLPTSection"
        WHERE exam_id = $1
          AND deleted_at IS NULL
        ORDER BY section_order ASC NULLS LAST, section_id ASC;
      `,
      [examId]
    );

    const questionResult = await databaseService.executeQuery(
      `
        SELECT s.section_id, q.question_id, q.question_text, q.question_type, q.difficulty_level,
               q.explanation, q.points, q.jlpt_level, q.section_type,
               q.reading_passage_id, rp.title AS reading_passage_title,
               rp.passage_text AS reading_passage_text, rp.image_url AS reading_passage_image_url,
               q.image_url, q.audio_url, jsq.order_index
        FROM "JLPTSectionQuestion" jsq
        JOIN "JLPTSection" s ON s.section_id = jsq.section_id
        JOIN "Question" q ON q.question_id = jsq.question_id
        LEFT JOIN "ReadingPassage" rp ON rp.passage_id = q.reading_passage_id AND rp.deleted_at IS NULL
        WHERE s.exam_id = $1
          AND s.deleted_at IS NULL
          AND jsq.deleted_at IS NULL
          AND q.deleted_at IS NULL
        ORDER BY s.section_order ASC NULLS LAST, s.section_id ASC, jsq.order_index ASC NULLS LAST, jsq.id ASC;
      `,
      [examId]
    );

    const optionsByQuestion = await this.getOptionsByQuestion(questionResult.rows.map((row) => row.question_id));
    const questionsBySection = new Map<number, unknown[]>();
    questionResult.rows.forEach((question) => {
      const questions = questionsBySection.get(question.section_id) ?? [];
      questions.push({
        ...question,
        points: Number(question.points),
        marks: Number(question.points ?? 1),
        options: optionsByQuestion.get(question.question_id) ?? [],
      });
      questionsBySection.set(question.section_id, questions);
    });

    return {
      ...exam,
      sections: sectionResult.rows.map((section) => ({
        ...section,
        questions: questionsBySection.get(section.section_id) ?? [],
      })),
    };
  }

  private async getOptionsByQuestion(questionIds: number[]) {
    const optionsByQuestion = new Map<number, unknown[]>();
    if (questionIds.length === 0) return optionsByQuestion;

    const optionResult = await databaseService.executeQuery(
      `
        SELECT option_id, question_id, option_text, explanation
        FROM "Option"
        WHERE question_id = ANY($1::int[])
        ORDER BY option_id ASC;
      `,
      [questionIds]
    );
    optionResult.rows.forEach((option) => {
      const options = optionsByQuestion.get(option.question_id) ?? [];
      options.push(option);
      optionsByQuestion.set(option.question_id, options);
    });

    return optionsByQuestion;
  }
}

export default new JlptExamDetailModel();
