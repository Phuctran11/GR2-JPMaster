import databaseService from "../../services/database.service.js";
import quizStateModel from "./quiz.state.model.js";
import { toNumber, withoutCorrectAnswers, type QuizDetail, type QuizOption } from "./quiz.types.js";

export class QuizDetailModel {
  async getQuizByIdInternal(quizId: number, userId?: number): Promise<QuizDetail | null> {
    const quizResult = await databaseService.executeQuery(
      `
        SELECT quiz_id, lesson_id, course_id, title, description, quiz_type, passing_score,
               total_marks, time_limit_minutes, created_by, created_at, updated_at
        FROM "Quiz"
        WHERE quiz_id = $1
          AND deleted_at IS NULL;
      `,
      [quizId]
    );
    const quizRow = quizResult.rows[0];
    if (!quizRow) return null;

    const questionResult = await databaseService.executeQuery(
      `
        SELECT
          q.question_id,
          q.question_text,
          q.question_type,
          q.difficulty_level,
          q.explanation,
          q.points,
          q.jlpt_level,
          q.section_type,
          q.image_asset_id,
          q.image_url,
          q.audio_asset_id,
          q.audio_url,
          qq.order_index,
          COALESCE(qq.marks, q.points, 1) AS marks
        FROM "QuizQuestion" qq
        JOIN "Question" q ON q.question_id = qq.question_id
        WHERE qq.quiz_id = $1
          AND qq.deleted_at IS NULL
          AND q.deleted_at IS NULL
        ORDER BY qq.order_index ASC NULLS LAST, qq.quiz_question_id ASC;
      `,
      [quizId]
    );
    const questionIds = questionResult.rows.map((row) => row.question_id);

    let optionsByQuestion = new Map<number, QuizOption[]>();
    if (questionIds.length > 0) {
      const optionsResult = await databaseService.executeQuery(
        `
          SELECT option_id, question_id, option_text, is_correct, explanation
          FROM "Option"
          WHERE question_id = ANY($1::int[])
          ORDER BY option_id ASC;
        `,
        [questionIds]
      );
      optionsByQuestion = optionsResult.rows.reduce((map, row) => {
        const questionOptions = map.get(row.question_id) ?? [];
        questionOptions.push({
          option_id: row.option_id,
          question_id: row.question_id,
          option_text: row.option_text,
          explanation: row.explanation,
          is_correct: Boolean(row.is_correct),
        });
        map.set(row.question_id, questionOptions);
        return map;
      }, new Map<number, QuizOption[]>());
    }

    const questions = questionResult.rows.map((row) => ({
      question_id: row.question_id,
      question_text: row.question_text,
      question_type: row.question_type,
      difficulty_level: row.difficulty_level,
      explanation: row.explanation,
      points: toNumber(row.points, 1),
      jlpt_level: row.jlpt_level,
      section_type: row.section_type,
      image_asset_id: row.image_asset_id,
      image_url: row.image_url,
      audio_asset_id: row.audio_asset_id,
      audio_url: row.audio_url,
      order_index: row.order_index,
      marks: toNumber(row.marks, 1),
      options: optionsByQuestion.get(row.question_id) ?? [],
    }));

    const totalMarksFromQuestions = questions.reduce((sum, question) => sum + question.marks, 0);
    const quiz: QuizDetail = {
      quiz_id: quizRow.quiz_id,
      lesson_id: quizRow.lesson_id,
      course_id: quizRow.course_id,
      title: quizRow.title,
      description: quizRow.description,
      quiz_type: quizRow.quiz_type,
      passing_score: toNumber(quizRow.passing_score, 70),
      total_marks: totalMarksFromQuestions || toNumber(quizRow.total_marks, 0),
      time_limit_minutes: quizRow.time_limit_minutes,
      created_by: quizRow.created_by,
      created_at: quizRow.created_at,
      updated_at: quizRow.updated_at,
      questions,
    };

    if (userId) {
      const attemptState = await quizStateModel.getQuizAttemptState(userId, quiz.quiz_id, quiz.passing_score);
      quiz.latest_attempt = attemptState.latestAttempt;
      quiz.has_passed = attemptState.hasPassed;
    }

    return quiz;
  }

  async getPublicQuizById(quizId: number, userId: number): Promise<QuizDetail | null> {
    const quiz = await this.getQuizByIdInternal(quizId, userId);
    return quiz ? withoutCorrectAnswers(quiz) : null;
  }
}

export default new QuizDetailModel();
