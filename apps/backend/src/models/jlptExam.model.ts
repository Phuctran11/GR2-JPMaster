import databaseService from "../services/database.service.js";

export interface JlptAnswerPayload {
  question_id: number;
  option_id?: number;
  option_ids?: number[];
  answer_text?: string;
}

const normalizeText = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();

export class JlptExamModel {
  async listExams(filters: { level?: string; section_type?: string }) {
    const values: unknown[] = [];
    const where: string[] = ["e.deleted_at IS NULL"];

    if (filters.level && filters.level !== "All") {
      values.push(filters.level);
      where.push(`e.jlpt_level = $${values.length}`);
    }

    if (filters.section_type && filters.section_type !== "all") {
      values.push(filters.section_type);
      where.push(`
        EXISTS (
          SELECT 1
          FROM "JLPTSection" fs
          WHERE fs.exam_id = e.exam_id
            AND fs.deleted_at IS NULL
            AND fs.section_type = $${values.length}
        )
      `);
    }

    const result = await databaseService.executeQuery(
      `
        SELECT e.exam_id, e.title, e.jlpt_level, e.year, e.duration_minutes, e.created_at,
               COUNT(DISTINCT s.section_id)::int AS section_count,
               COUNT(DISTINCT jsq.question_id)::int AS question_count,
               STRING_AGG(DISTINCT s.section_type, ',' ORDER BY s.section_type) AS section_types
        FROM "JLPTExam" e
        LEFT JOIN "JLPTSection" s ON s.exam_id = e.exam_id AND s.deleted_at IS NULL
        LEFT JOIN "JLPTSectionQuestion" jsq ON jsq.section_id = s.section_id AND jsq.deleted_at IS NULL
        WHERE ${where.join(" AND ")}
        GROUP BY e.exam_id
        HAVING COUNT(DISTINCT jsq.question_id) > 0
        ORDER BY e.exam_id DESC;
      `,
      values
    );

    return result.rows.map((row) => ({
      ...row,
      section_types: row.section_types ? String(row.section_types).split(",") : [],
    }));
  }

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
               q.image_url, q.audio_url, jsq.order_index
        FROM "JLPTSectionQuestion" jsq
        JOIN "JLPTSection" s ON s.section_id = jsq.section_id
        JOIN "Question" q ON q.question_id = jsq.question_id
        WHERE s.exam_id = $1
          AND s.deleted_at IS NULL
          AND jsq.deleted_at IS NULL
          AND q.deleted_at IS NULL
        ORDER BY s.section_order ASC NULLS LAST, s.section_id ASC, jsq.order_index ASC NULLS LAST, jsq.id ASC;
      `,
      [examId]
    );

    const questionIds = questionResult.rows.map((row) => row.question_id);
    const optionsByQuestion = new Map<number, unknown[]>();

    if (questionIds.length) {
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
    }

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

  async submitExam(examId: number, answers: JlptAnswerPayload[]) {
    const exam = await this.getExamById(examId);
    if (!exam) return null;

    const questions = exam.sections.flatMap((section: any) => section.questions);
    const questionIds = questions.map((question: any) => question.question_id);
    const optionResult = questionIds.length
      ? await databaseService.executeQuery(
          `
            SELECT option_id, question_id, option_text, is_correct
            FROM "Option"
            WHERE question_id = ANY($1::int[]);
          `,
          [questionIds]
        )
      : { rows: [] };

    const optionsByQuestion = new Map<number, Array<{ option_id: number; option_text: string; is_correct: boolean }>>();
    optionResult.rows.forEach((option) => {
      const options = optionsByQuestion.get(option.question_id) ?? [];
      options.push({ ...option, is_correct: Boolean(option.is_correct) });
      optionsByQuestion.set(option.question_id, options);
    });

    const answersByQuestion = new Map<number, JlptAnswerPayload>();
    answers.forEach((answer) => answersByQuestion.set(Number(answer.question_id), answer));

    let earnedMarks = 0;
    const totalMarks = questions.reduce((sum: number, question: any) => sum + Number(question.marks ?? question.points ?? 1), 0);

    const questionResults = questions.map((question: any) => {
      const answer = answersByQuestion.get(question.question_id);
      const options = optionsByQuestion.get(question.question_id) ?? [];
      const correctOptions = options.filter((option) => option.is_correct);
      const correctOptionIds = correctOptions.map((option) => option.option_id).sort((a, b) => a - b);
      const selectedOptionIds = question.question_type === "multiple_choice"
        ? (answer?.option_ids ?? []).map(Number).sort((a, b) => a - b)
        : answer?.option_id
          ? [Number(answer.option_id)]
          : [];

      const isCorrect = question.question_type === "fill_in_blank"
        ? correctOptions.some((option) => normalizeText(option.option_text) === normalizeText(answer?.answer_text))
        : selectedOptionIds.length === correctOptionIds.length && selectedOptionIds.every((id, index) => id === correctOptionIds[index]);

      const marks = Number(question.marks ?? question.points ?? 1);
      if (isCorrect) earnedMarks += marks;

      return {
        question_id: question.question_id,
        section_id: question.section_id,
        is_correct: isCorrect,
        explanation: question.explanation ?? null,
        selected_option_ids: selectedOptionIds,
        correct_option_ids: correctOptionIds,
        answer_text: answer?.answer_text ?? null,
        marks,
        earned_marks: isCorrect ? marks : 0,
      };
    });

    const score = totalMarks > 0 ? (earnedMarks / totalMarks) * 100 : 0;

    return {
      exam_id: exam.exam_id,
      score,
      total_marks: totalMarks,
      earned_marks: earnedMarks,
      passed: score >= 60,
      submitted_at: new Date().toISOString(),
      question_results: questionResults,
    };
  }
}

export default new JlptExamModel();
