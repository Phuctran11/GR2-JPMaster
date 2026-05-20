import pool from "../config/database.js";
import databaseService from "../services/database.service.js";

export type QuestionType = "single_choice" | "multiple_choice" | "true_false" | "fill_in_blank";

export interface QuizOption {
  option_id: number;
  question_id: number;
  option_text: string;
  explanation: string | null;
  is_correct?: boolean;
}

export interface QuizQuestion {
  question_id: number;
  question_text: string;
  question_type: QuestionType;
  difficulty_level: string | null;
  explanation: string | null;
  points: number;
  jlpt_level: string | null;
  section_type: string | null;
  order_index: number | null;
  marks: number;
  options: QuizOption[];
}

export interface QuizDetail {
  quiz_id: number;
  lesson_id: number | null;
  course_id: number | null;
  title: string;
  description: string | null;
  quiz_type: "lesson_quiz" | "practice_test" | "final_test" | "jlpt_mock" | null;
  passing_score: number;
  total_marks: number;
  time_limit_minutes: number | null;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  questions: QuizQuestion[];
  latest_attempt?: QuizAttemptSummary | null;
  has_passed?: boolean;
}

export interface QuizAttemptSummary {
  attempt_id: number;
  quiz_id: number;
  score: number | null;
  total_marks: number | null;
  status: "in_progress" | "submitted" | "graded";
  started_at: Date;
  submitted_at: Date | null;
  passed: boolean;
}

export interface QuizAnswerInput {
  question_id: number;
  option_id?: number;
  option_ids?: number[];
  answer_text?: string;
}

const toNumber = (value: unknown, fallback = 0) => (value == null ? fallback : Number(value));

const normalizeText = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

const withoutCorrectAnswers = (quiz: QuizDetail): QuizDetail => ({
  ...quiz,
  questions: quiz.questions.map((question) => ({
    ...question,
    options: question.options.map(({ is_correct: _isCorrect, ...option }) => option),
  })),
});

export class QuizModel {
  private async getLatestAttempt(userId: number, quizId: number): Promise<QuizAttemptSummary | null> {
    const query = `
      SELECT attempt_id, quiz_id, score, total_marks, status, started_at, submitted_at
      FROM "QuizAttempt"
      WHERE user_id = $1 AND quiz_id = $2 AND status IN ('submitted', 'graded')
      ORDER BY submitted_at DESC NULLS LAST, attempt_id DESC
      LIMIT 1;
    `;
    const result = await databaseService.executeQuery(query, [userId, quizId]);
    const row = result.rows[0];
    if (!row) return null;

    const passingScoreResult = await databaseService.executeQuery(
      `SELECT passing_score FROM "Quiz" WHERE quiz_id = $1;`,
      [quizId]
    );
    const passingScore = toNumber(passingScoreResult.rows[0]?.passing_score, 70);
    const score = row.score == null ? null : Number(row.score);

    return {
      attempt_id: row.attempt_id,
      quiz_id: row.quiz_id,
      score,
      total_marks: row.total_marks == null ? null : Number(row.total_marks),
      status: row.status,
      started_at: row.started_at,
      submitted_at: row.submitted_at,
      passed: score != null && score >= passingScore,
    };
  }

  private async getHasPassedQuiz(userId: number, quizId: number): Promise<boolean> {
    const query = `
      SELECT 1
      FROM "QuizAttempt" qa
      JOIN "Quiz" q ON q.quiz_id = qa.quiz_id
      WHERE qa.user_id = $1
        AND qa.quiz_id = $2
        AND qa.status IN ('submitted', 'graded')
        AND qa.score >= q.passing_score
      LIMIT 1;
    `;
    const result = await databaseService.executeQuery(query, [userId, quizId]);
    return Boolean(result.rows[0]);
  }

  private async getQuizByIdInternal(quizId: number, userId?: number): Promise<QuizDetail | null> {
    const quizQuery = `
      SELECT quiz_id, lesson_id, course_id, title, description, quiz_type, passing_score,
             total_marks, time_limit_minutes, created_by, created_at, updated_at
      FROM "Quiz"
      WHERE quiz_id = $1;
    `;
    const quizResult = await databaseService.executeQuery(quizQuery, [quizId]);
    const quizRow = quizResult.rows[0];
    if (!quizRow) return null;

    const questionsQuery = `
      SELECT
        q.question_id,
        q.question_text,
        q.question_type,
        q.difficulty_level,
        q.explanation,
        q.points,
        q.jlpt_level,
        q.section_type,
        qq.order_index,
        COALESCE(qq.marks, q.points, 1) AS marks
      FROM "QuizQuestion" qq
      JOIN "Question" q ON q.question_id = qq.question_id
      WHERE qq.quiz_id = $1
      ORDER BY qq.order_index ASC NULLS LAST, qq.quiz_question_id ASC;
    `;
    const questionResult = await databaseService.executeQuery(questionsQuery, [quizId]);
    const questionIds = questionResult.rows.map((row) => row.question_id);

    let optionsByQuestion = new Map<number, QuizOption[]>();
    if (questionIds.length > 0) {
      const optionsQuery = `
        SELECT option_id, question_id, option_text, is_correct, explanation
        FROM "Option"
        WHERE question_id = ANY($1::int[])
        ORDER BY option_id ASC;
      `;
      const optionsResult = await databaseService.executeQuery(optionsQuery, [questionIds]);
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
      quiz.latest_attempt = await this.getLatestAttempt(userId, quiz.quiz_id);
      quiz.has_passed = await this.getHasPassedQuiz(userId, quiz.quiz_id);
    }

    return quiz;
  }

  async getPublicQuizById(quizId: number, userId: number): Promise<QuizDetail | null> {
    const quiz = await this.getQuizByIdInternal(quizId, userId);
    return quiz ? withoutCorrectAnswers(quiz) : null;
  }

  async getQuizCourseId(quizId: number): Promise<number | null> {
    const query = `
      SELECT COALESCE(q.course_id, l.course_id) AS course_id
      FROM "Quiz" q
      LEFT JOIN "Lesson" l ON l.lesson_id = q.lesson_id
      WHERE q.quiz_id = $1;
    `;
    const result = await databaseService.executeQuery(query, [quizId]);
    const courseId = result.rows[0]?.course_id;
    return courseId == null ? null : Number(courseId);
  }

  async getLessonQuiz(lessonId: number, userId: number): Promise<QuizDetail | null> {
    const query = `
      SELECT quiz_id
      FROM "Quiz"
      WHERE lesson_id = $1 AND quiz_type = 'lesson_quiz'
      ORDER BY quiz_id DESC
      LIMIT 1;
    `;
    const result = await databaseService.executeQuery(query, [lessonId]);
    const quizId = result.rows[0]?.quiz_id;
    if (!quizId) return null;

    return this.getPublicQuizById(Number(quizId), userId);
  }

  async getFinalQuiz(courseId: number, userId: number): Promise<QuizDetail | null> {
    const query = `
      SELECT quiz_id
      FROM "Quiz"
      WHERE course_id = $1
        AND quiz_type = 'final_test'
      ORDER BY quiz_id DESC
      LIMIT 1;
    `;
    const result = await databaseService.executeQuery(query, [courseId]);
    const quizId = result.rows[0]?.quiz_id;
    if (!quizId) return null;

    return this.getPublicQuizById(Number(quizId), userId);
  }

  async hasPassedQuiz(userId: number, quizId: number): Promise<boolean> {
    return this.getHasPassedQuiz(userId, quizId);
  }

  async hasPassedLessonQuiz(userId: number, lessonId: number): Promise<boolean> {
    const quiz = await this.getLessonQuiz(lessonId, userId);
    if (!quiz) return true;
    return Boolean(quiz.has_passed);
  }

  async hasPassedFinalQuiz(userId: number, courseId: number): Promise<boolean> {
    const quiz = await this.getFinalQuiz(courseId, userId);
    if (!quiz) return true;
    return Boolean(quiz.has_passed);
  }

  async startQuizAttempt(userId: number, quizId: number): Promise<QuizAttemptSummary> {
    const quiz = await this.getQuizByIdInternal(quizId);
    if (!quiz) {
      throw new Error("Quiz not found");
    }

    const query = `
      INSERT INTO "QuizAttempt" (user_id, quiz_id, started_at, status)
      VALUES ($1, $2, NOW(), 'in_progress')
      RETURNING attempt_id, quiz_id, score, total_marks, status, started_at, submitted_at;
    `;
    const result = await databaseService.executeQuery(query, [userId, quizId]);
    const row = result.rows[0];

    return {
      attempt_id: row.attempt_id,
      quiz_id: row.quiz_id,
      score: row.score == null ? null : Number(row.score),
      total_marks: row.total_marks == null ? null : Number(row.total_marks),
      status: row.status,
      started_at: row.started_at,
      submitted_at: row.submitted_at,
      passed: false,
    };
  }

  async submitQuiz(userId: number, quizId: number, answers: QuizAnswerInput[], attemptId?: number) {
    const quiz = await this.getQuizByIdInternal(quizId);
    if (!quiz) {
      throw new Error("Quiz not found");
    }

    const answersByQuestion = new Map<number, QuizAnswerInput>();
    answers.forEach((answer) => answersByQuestion.set(answer.question_id, answer));

    let earnedMarks = 0;
    const gradedAnswers = quiz.questions.map((question) => {
      const answer = answersByQuestion.get(question.question_id);
      const correctOptionIds = question.options.filter((option) => option.is_correct).map((option) => option.option_id);
      const validOptionIds = new Set(question.options.map((option) => option.option_id));
      const selectedOptionIds = Array.from(
        new Set([...(answer?.option_ids ?? []), ...(answer?.option_id ? [answer.option_id] : [])])
      )
        .filter((optionId) => validOptionIds.has(optionId))
        .sort((a, b) => a - b);

      let isCorrect = false;
      if (question.question_type === "fill_in_blank") {
        const correctTexts = question.options.filter((option) => option.is_correct).map((option) => normalizeText(option.option_text));
        const userText = normalizeText(answer?.answer_text ?? "");
        isCorrect = Boolean(userText && correctTexts.includes(userText));
      } else if (question.question_type === "multiple_choice") {
        const sortedCorrectOptionIds = [...correctOptionIds].sort((a, b) => a - b);
        isCorrect =
          sortedCorrectOptionIds.length > 0 &&
          selectedOptionIds.length === sortedCorrectOptionIds.length &&
          selectedOptionIds.every((optionId, index) => optionId === sortedCorrectOptionIds[index]);
      } else {
        isCorrect = correctOptionIds.length > 0 && selectedOptionIds.length === 1 && correctOptionIds.includes(selectedOptionIds[0]);
      }

      if (isCorrect) {
        earnedMarks += question.marks;
      }

      return {
        question,
        answer,
        selectedOptionIds,
        isCorrect,
      };
    });

    const totalMarks = quiz.total_marks || quiz.questions.reduce((sum, question) => sum + question.marks, 0);
    const score = totalMarks > 0 ? Number(((earnedMarks / totalMarks) * 100).toFixed(2)) : 0;
    const passed = score >= quiz.passing_score;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      let attemptResult;
      if (attemptId) {
        attemptResult = await client.query(
          `
            UPDATE "QuizAttempt"
            SET submitted_at = NOW(), score = $1, total_marks = $2, status = 'graded'
            WHERE attempt_id = $3
              AND user_id = $4
              AND quiz_id = $5
              AND status = 'in_progress'
            RETURNING attempt_id, quiz_id, score, total_marks, status, started_at, submitted_at;
          `,
          [score, totalMarks, attemptId, userId, quizId]
        );
      }

      if (!attemptResult?.rows[0]) {
        attemptResult = await client.query(
          `
            INSERT INTO "QuizAttempt" (user_id, quiz_id, started_at, submitted_at, score, total_marks, status)
            VALUES ($1, $2, NOW(), NOW(), $3, $4, 'graded')
            RETURNING attempt_id, quiz_id, score, total_marks, status, started_at, submitted_at;
          `,
          [userId, quizId, score, totalMarks]
        );
      }

      const attempt = attemptResult.rows[0];

      for (const gradedAnswer of gradedAnswers) {
        const optionIds = gradedAnswer.selectedOptionIds.length > 0 ? gradedAnswer.selectedOptionIds : [null];
        for (const optionId of optionIds) {
          await client.query(
            `
              INSERT INTO "UserAnswer" (attempt_id, question_id, option_id, answer_text, is_correct, answered_at)
              VALUES ($1, $2, $3, $4, $5, NOW());
            `,
            [
              attempt.attempt_id,
              gradedAnswer.question.question_id,
              optionId,
              gradedAnswer.answer?.answer_text ?? null,
              gradedAnswer.isCorrect,
            ]
          );
        }
      }

      await client.query("COMMIT");

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
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

export default new QuizModel();
