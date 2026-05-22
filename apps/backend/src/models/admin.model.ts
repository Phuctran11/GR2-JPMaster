import databaseService from "../services/database.service.js";
import pool from "../config/database.js";
import { PoolClient } from "pg";

export type UserRole = "guest" | "learner" | "admin";
export type UserStatus = "active" | "suspended" | "deleted";
export type LessonContentType = "video" | "text" | "quiz";
export type QuizType = "lesson_quiz" | "practice_test" | "final_test";
export type BlogStatus = "draft" | "published" | "archived";
export type QuestionType = "single_choice" | "multiple_choice" | "true_false" | "fill_in_blank";
export type SectionType = "vocabulary" | "grammar" | "reading" | "listening";
export type JlptLevel = "N5" | "N4" | "N3" | "N2" | "N1";
export type SortOrder = "asc" | "desc";

export interface AdminListParams {
  limit?: number;
  offset?: number;
  search?: string;
  role?: UserRole | "all";
  level?: string;
  courseId?: number;
  quizType?: QuizType | "all";
  status?: BlogStatus | "all";
  sortOrder?: SortOrder;
}

export interface AdminStats {
  totals: {
    users: number;
    courses: number;
    lessons: number;
    tests: number;
    blogs: number;
  };
  usersByRole: Array<{ role: UserRole; count: number }>;
  testsByType: Array<{ quiz_type: QuizType | null; count: number }>;
  recentUsers: Array<{ user_id: number; username: string; email: string; role: UserRole; status: UserStatus; created_at: Date }>;
  recentCourses: Array<{ course_id: number; title: string; price: number; level: string | null; created_at: Date }>;
}

const withLimitOffset = (params: AdminListParams) => ({
  limit: Math.min(Number(params.limit) || 20, 100),
  offset: Math.max(Number(params.offset) || 0, 0),
});

const orderDirection = (params: AdminListParams) => (params.sortOrder === "asc" ? "ASC" : "DESC");

const isUndefined = (value: unknown) => value === undefined;

export interface AdminQuestionOptionInput {
  option_id?: number;
  option_text: string;
  is_correct: boolean;
  explanation?: string | null;
}

export interface AdminQuizQuestionInput {
  question_text: string;
  question_type: QuestionType;
  difficulty_level?: string | null;
  explanation?: string | null;
  points: number;
  jlpt_level?: string | null;
  section_type?: string | null;
  image_asset_id?: number | null;
  image_url?: string | null;
  audio_asset_id?: number | null;
  audio_url?: string | null;
  order_index?: number | null;
  marks: number;
  options: AdminQuestionOptionInput[];
}

export interface AdminJlptSectionInput {
  title: string;
  section_type: SectionType;
  section_order: number;
  duration_minutes?: number | null;
  audio_asset_id?: number | null;
  audio_url?: string | null;
}

export class AdminModel {
  private async hasBlogTable(): Promise<boolean> {
    const result = await databaseService.executeQuery(`SELECT to_regclass('"Blog"') AS table_name;`);
    return Boolean(result.rows[0]?.table_name);
  }

  async getStats(): Promise<AdminStats> {
    const hasBlogTable = await this.hasBlogTable();
    const query = `
      SELECT
        (SELECT COUNT(*)::int FROM "User" WHERE status <> 'deleted' AND deleted_at IS NULL) AS users,
        (SELECT COUNT(*)::int FROM "Course" WHERE deleted_at IS NULL) AS courses,
        (SELECT COUNT(*)::int FROM "Lesson" WHERE deleted_at IS NULL) AS lessons,
        (SELECT COUNT(*)::int FROM "Quiz" WHERE deleted_at IS NULL) AS tests,
        ${hasBlogTable ? `(SELECT COUNT(*)::int FROM "Blog")` : "0"} AS blogs;
    `;
    const totalsResult = await databaseService.executeQuery(query);
    const usersByRoleResult = await databaseService.executeQuery(`
      SELECT role, COUNT(*)::int AS count
      FROM "User"
      WHERE status <> 'deleted'
        AND deleted_at IS NULL
      GROUP BY role
      ORDER BY count DESC;
    `);
    const testsByTypeResult = await databaseService.executeQuery(`
      SELECT quiz_type, COUNT(*)::int AS count
      FROM "Quiz"
      WHERE deleted_at IS NULL
      GROUP BY quiz_type
      ORDER BY count DESC;
    `);
    const recentUsersResult = await databaseService.executeQuery(`
      SELECT user_id, username, email, role, status, created_at
      FROM "User"
      WHERE status <> 'deleted'
        AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 5;
    `);
    const recentCoursesResult = await databaseService.executeQuery(`
      SELECT course_id, title, price, level, created_at
      FROM "Course"
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 5;
    `);

    return {
      totals: totalsResult.rows[0],
      usersByRole: usersByRoleResult.rows,
      testsByType: testsByTypeResult.rows,
      recentUsers: recentUsersResult.rows,
      recentCourses: recentCoursesResult.rows.map((row) => ({ ...row, price: Number(row.price) })),
    };
  }

  async listUsers(params: AdminListParams) {
    const { limit, offset } = withLimitOffset(params);
    const direction = orderDirection(params);
    const values: unknown[] = [];
    const where: string[] = [];

    if (params.search?.trim()) {
      values.push(`%${params.search.trim()}%`);
      where.push(`(username ILIKE $${values.length} OR email ILIKE $${values.length})`);
    }

    if (params.role && params.role !== "all") {
      values.push(params.role);
      where.push(`role = $${values.length}`);
    }

    values.push(limit, offset);
    const query = `
      SELECT user_id, username, email, role, status, deleted_at, created_at, updated_at
      FROM "User"
      WHERE status <> 'deleted'
        AND deleted_at IS NULL
        ${where.length ? `AND ${where.join(" AND ")}` : ""}
      ORDER BY user_id ${direction}
      LIMIT $${values.length - 1} OFFSET $${values.length};
    `;
    const result = await databaseService.executeQuery(query, values);
    return result.rows;
  }

  async softDeleteUser(userId: number): Promise<boolean> {
    const result = await databaseService.executeQuery(
      `
        UPDATE "User"
        SET status = 'deleted',
            deleted_at = COALESCE(deleted_at, NOW()),
            updated_at = NOW()
        WHERE user_id = $1
          AND status <> 'deleted'
          AND deleted_at IS NULL;
      `,
      [userId]
    );
    return Boolean(result.rowCount);
  }

  async listCourses(params: AdminListParams) {
    const { limit, offset } = withLimitOffset(params);
    const direction = orderDirection(params);
    const values: unknown[] = [];
    const where: string[] = [`c.deleted_at IS NULL`];

    if (params.search?.trim()) {
      values.push(`%${params.search.trim()}%`);
      where.push(`(c.title ILIKE $${values.length} OR c.description ILIKE $${values.length})`);
    }

    if (params.level?.trim()) {
      values.push(`%${params.level.trim()}%`);
      where.push(`c.level ILIKE $${values.length}`);
    }

    values.push(limit, offset);
    const query = `
      SELECT c.course_id, c.title, c.description, c.price, c.level, c.duration, c.created_by,
             c.cover_asset_id, c.image_url, u.username AS creator_username, c.created_at, c.updated_at,
             COUNT(l.lesson_id)::int AS lesson_count
      FROM "Course" c
      LEFT JOIN "User" u ON u.user_id = c.created_by
      LEFT JOIN "Lesson" l ON l.course_id = c.course_id AND l.deleted_at IS NULL
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      GROUP BY c.course_id, u.username
      ORDER BY c.course_id ${direction}
      LIMIT $${values.length - 1} OFFSET $${values.length};
    `;
    const result = await databaseService.executeQuery(query, values);
    return result.rows.map((row) => ({ ...row, price: Number(row.price) }));
  }

  async createCourse(input: {
    title: string;
    description: string | null;
    price: number;
    level: string | null;
    duration: number | null;
    cover_asset_id: number | null;
    image_url: string | null;
    created_by: number;
  }) {
    const result = await databaseService.executeQuery(
      `
        INSERT INTO "Course" (title, description, price, level, duration, cover_asset_id, image_url, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING course_id, title, description, price, level, duration, cover_asset_id, image_url, created_by, created_at, updated_at;
      `,
      [input.title, input.description, input.price, input.level, input.duration, input.cover_asset_id, input.image_url, input.created_by]
    );
    return { ...result.rows[0], price: Number(result.rows[0].price) };
  }

  async updateCourse(
    courseId: number,
    input: Partial<{
      title: string;
      description: string | null;
      price: number;
      level: string | null;
      duration: number | null;
      cover_asset_id: number | null;
      image_url: string | null;
    }>
  ) {
    const updates: string[] = [];
    const values: unknown[] = [];
    const fields = ["title", "description", "price", "level", "duration", "cover_asset_id", "image_url"] as const;

    fields.forEach((field) => {
      if (!isUndefined(input[field])) {
        values.push(input[field]);
        updates.push(`${field} = $${values.length}`);
      }
    });

    if (!updates.length) return null;

    values.push(courseId);
    const result = await databaseService.executeQuery(
      `
        UPDATE "Course"
        SET ${updates.join(", ")}, updated_at = NOW()
        WHERE course_id = $${values.length}
          AND deleted_at IS NULL
        RETURNING course_id, title, description, price, level, duration, cover_asset_id, image_url, created_by, created_at, updated_at;
      `,
      values
    );
    return result.rows[0] ? { ...result.rows[0], price: Number(result.rows[0].price) } : null;
  }

  async deleteCourse(courseId: number): Promise<boolean> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const existing = await client.query(`SELECT course_id FROM "Course" WHERE course_id = $1 AND deleted_at IS NULL;`, [courseId]);
      if (!existing.rowCount) {
        await client.query("ROLLBACK");
        return false;
      }

      await client.query(
        `
          UPDATE "Quiz"
          SET deleted_at = COALESCE(deleted_at, NOW()),
              updated_at = NOW()
          WHERE deleted_at IS NULL
            AND (
              course_id = $1
              OR lesson_id IN (SELECT lesson_id FROM "Lesson" WHERE course_id = $1)
            );
        `,
        [courseId]
      );
      await client.query(
        `
          UPDATE "Lesson"
          SET deleted_at = COALESCE(deleted_at, NOW()),
              updated_at = NOW()
          WHERE course_id = $1
            AND deleted_at IS NULL;
        `,
        [courseId]
      );
      await client.query(
        `
          UPDATE "Course"
          SET deleted_at = COALESCE(deleted_at, NOW()),
              updated_at = NOW()
          WHERE course_id = $1
            AND deleted_at IS NULL;
        `,
        [courseId]
      );

      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async listLessons(params: AdminListParams) {
    const { limit, offset } = withLimitOffset(params);
    const values: unknown[] = [];
    const where: string[] = [`l.deleted_at IS NULL`, `c.deleted_at IS NULL`];

    if (params.search?.trim()) {
      values.push(`%${params.search.trim()}%`);
      where.push(`(l.title ILIKE $${values.length} OR l.content_text ILIKE $${values.length})`);
    }

    if (params.courseId) {
      values.push(params.courseId);
      where.push(`l.course_id = $${values.length}`);
    }

    values.push(limit, offset);
    const result = await databaseService.executeQuery(
      `
        SELECT l.lesson_id, l.course_id, c.title AS course_title, l.title, l.content_type,
               l.content_text, l.video_asset_id, l.video_url, l.audio_asset_id, l.audio_url,
               l.order_index, l.duration, l.created_at, l.updated_at
        FROM "Lesson" l
        JOIN "Course" c ON c.course_id = l.course_id
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY l.course_id ASC, l.order_index ASC
        LIMIT $${values.length - 1} OFFSET $${values.length};
      `,
      values
    );
    return result.rows;
  }

  async createLesson(input: {
    course_id: number;
    title: string;
    content_type: LessonContentType;
    content_text: string | null;
    video_asset_id: number | null;
    video_url: string | null;
    audio_asset_id: number | null;
    audio_url: string | null;
    order_index: number;
    duration: number | null;
  }) {
    const result = await databaseService.executeQuery(
      `
        INSERT INTO "Lesson" (
          course_id, title, content_type, content_text, video_asset_id, video_url,
          audio_asset_id, audio_url, order_index, duration, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING lesson_id, course_id, title, content_type, content_text, video_asset_id, video_url,
                  audio_asset_id, audio_url, order_index, duration, created_at, updated_at;
      `,
      [
        input.course_id,
        input.title,
        input.content_type,
        input.content_text,
        input.video_asset_id,
        input.video_url,
        input.audio_asset_id,
        input.audio_url,
        input.order_index,
        input.duration,
      ]
    );
    return result.rows[0];
  }

  async updateLesson(
    lessonId: number,
    input: Partial<{
      title: string;
      content_type: LessonContentType;
      content_text: string | null;
      video_asset_id: number | null;
      video_url: string | null;
      audio_asset_id: number | null;
      audio_url: string | null;
      order_index: number;
      duration: number | null;
    }>
  ) {
    const updates: string[] = [];
    const values: unknown[] = [];
    const fields = ["title", "content_type", "content_text", "video_asset_id", "video_url", "audio_asset_id", "audio_url", "order_index", "duration"] as const;

    fields.forEach((field) => {
      if (!isUndefined(input[field])) {
        values.push(input[field]);
        updates.push(`${field} = $${values.length}`);
      }
    });

    if (!updates.length) return null;
    values.push(lessonId);
    const result = await databaseService.executeQuery(
      `
        UPDATE "Lesson"
        SET ${updates.join(", ")}, updated_at = NOW()
        WHERE lesson_id = $${values.length}
          AND deleted_at IS NULL
        RETURNING lesson_id, course_id, title, content_type, content_text, video_asset_id, video_url,
                  audio_asset_id, audio_url, order_index, duration, created_at, updated_at;
      `,
      values
    );
    return result.rows[0] || null;
  }

  async deleteLesson(lessonId: number): Promise<boolean> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const existing = await client.query(`SELECT lesson_id FROM "Lesson" WHERE lesson_id = $1 AND deleted_at IS NULL;`, [lessonId]);
      if (!existing.rowCount) {
        await client.query("ROLLBACK");
        return false;
      }

      await client.query(
        `
          UPDATE "Quiz"
          SET deleted_at = COALESCE(deleted_at, NOW()),
              updated_at = NOW()
          WHERE lesson_id = $1
            AND deleted_at IS NULL;
        `,
        [lessonId]
      );
      await client.query(
        `
          UPDATE "Lesson"
          SET deleted_at = COALESCE(deleted_at, NOW()),
              updated_at = NOW()
          WHERE lesson_id = $1
            AND deleted_at IS NULL;
        `,
        [lessonId]
      );

      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async listQuizzes(params: AdminListParams) {
    const { limit, offset } = withLimitOffset(params);
    const direction = orderDirection(params);
    const values: unknown[] = [];
    const where: string[] = [`q.deleted_at IS NULL`];

    if (params.search?.trim()) {
      values.push(`%${params.search.trim()}%`);
      where.push(`(q.title ILIKE $${values.length} OR q.description ILIKE $${values.length})`);
    }

    if (params.quizType && params.quizType !== "all") {
      values.push(params.quizType);
      where.push(`q.quiz_type = $${values.length}`);
    }

    values.push(limit, offset);
    const result = await databaseService.executeQuery(
      `
        SELECT q.quiz_id, q.lesson_id, q.course_id, COALESCE(c.title, lc.title) AS course_title,
               q.title, q.description, q.quiz_type, q.passing_score, q.total_marks,
               q.time_limit_minutes, q.created_by, q.created_at, q.updated_at,
               COUNT(qq.quiz_question_id)::int AS question_count
        FROM "Quiz" q
        LEFT JOIN "Course" c ON c.course_id = q.course_id AND c.deleted_at IS NULL
        LEFT JOIN "Lesson" l ON l.lesson_id = q.lesson_id AND l.deleted_at IS NULL
        LEFT JOIN "Course" lc ON lc.course_id = l.course_id AND lc.deleted_at IS NULL
        LEFT JOIN "QuizQuestion" qq ON qq.quiz_id = q.quiz_id AND qq.deleted_at IS NULL
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        GROUP BY q.quiz_id, c.title, lc.title
        ORDER BY q.quiz_id ${direction}
        LIMIT $${values.length - 1} OFFSET $${values.length};
      `,
      values
    );
    return result.rows.map((row) => ({
      ...row,
      passing_score: Number(row.passing_score),
      total_marks: Number(row.total_marks),
    }));
  }

  async createQuiz(input: {
    lesson_id: number | null;
    course_id: number | null;
    title: string;
    description: string | null;
    quiz_type: QuizType;
    passing_score: number;
    total_marks: number;
    time_limit_minutes: number | null;
    created_by: number;
  }) {
    const result = await databaseService.executeQuery(
      `
        INSERT INTO "Quiz" (lesson_id, course_id, title, description, quiz_type, passing_score, total_marks, time_limit_minutes, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING quiz_id, lesson_id, course_id, title, description, quiz_type, passing_score, total_marks, time_limit_minutes, created_by, created_at, updated_at;
      `,
      [
        input.lesson_id,
        input.course_id,
        input.title,
        input.description,
        input.quiz_type,
        input.passing_score,
        input.total_marks,
        input.time_limit_minutes,
        input.created_by,
      ]
    );
    return result.rows[0];
  }

  async updateQuiz(quizId: number, input: Partial<{ lesson_id: number | null; course_id: number | null; title: string; description: string | null; quiz_type: QuizType; passing_score: number; total_marks: number; time_limit_minutes: number | null }>) {
    const updates: string[] = [];
    const values: unknown[] = [];
    const fields = ["lesson_id", "course_id", "title", "description", "quiz_type", "passing_score", "total_marks", "time_limit_minutes"] as const;

    fields.forEach((field) => {
      if (!isUndefined(input[field])) {
        values.push(input[field]);
        updates.push(`${field} = $${values.length}`);
      }
    });

    if (!updates.length) return null;
    values.push(quizId);
    const result = await databaseService.executeQuery(
      `
        UPDATE "Quiz"
        SET ${updates.join(", ")}, updated_at = NOW()
        WHERE quiz_id = $${values.length}
          AND deleted_at IS NULL
        RETURNING quiz_id, lesson_id, course_id, title, description, quiz_type, passing_score, total_marks, time_limit_minutes, created_by, created_at, updated_at;
      `,
      values
    );
    return result.rows[0] || null;
  }

  async deleteQuiz(quizId: number): Promise<boolean> {
    const result = await databaseService.executeQuery(
      `
        UPDATE "Quiz"
        SET deleted_at = COALESCE(deleted_at, NOW()),
            updated_at = NOW()
        WHERE quiz_id = $1
          AND deleted_at IS NULL;
      `,
      [quizId]
    );
    return Boolean(result.rowCount);
  }

  async listQuizQuestions(quizId: number) {
    const questionResult = await databaseService.executeQuery(
      `
        SELECT q.question_id, q.question_text, q.question_type, q.difficulty_level, q.explanation,
               q.points, q.jlpt_level, q.section_type, q.image_asset_id, q.image_url, q.audio_asset_id, q.audio_url,
               qq.order_index, COALESCE(qq.marks, q.points, 1) AS marks
        FROM "QuizQuestion" qq
        JOIN "Question" q ON q.question_id = qq.question_id
        JOIN "Quiz" quiz ON quiz.quiz_id = qq.quiz_id
        WHERE qq.quiz_id = $1
          AND quiz.deleted_at IS NULL
          AND qq.deleted_at IS NULL
          AND q.deleted_at IS NULL
        ORDER BY qq.order_index ASC NULLS LAST, qq.quiz_question_id ASC;
      `,
      [quizId]
    );
    const questionIds = questionResult.rows.map((row) => row.question_id);
    const optionsByQuestion = new Map<number, unknown[]>();

    if (questionIds.length) {
      const optionResult = await databaseService.executeQuery(
        `
          SELECT option_id, question_id, option_text, is_correct, explanation
          FROM "Option"
          WHERE question_id = ANY($1::int[])
          ORDER BY option_id ASC;
        `,
        [questionIds]
      );
      optionResult.rows.forEach((option) => {
        const options = optionsByQuestion.get(option.question_id) ?? [];
        options.push({ ...option, is_correct: Boolean(option.is_correct) });
        optionsByQuestion.set(option.question_id, options);
      });
    }

    return questionResult.rows.map((row) => ({
      ...row,
      points: Number(row.points),
      marks: Number(row.marks),
      options: optionsByQuestion.get(row.question_id) ?? [],
    }));
  }

  private async recalculateQuizTotalMarks(client: PoolClient, quizId: number) {
    await client.query(
      `
        UPDATE "Quiz"
        SET total_marks = COALESCE((
              SELECT SUM(COALESCE(marks, 0))
              FROM "QuizQuestion"
              WHERE quiz_id = $1
                AND deleted_at IS NULL
            ), 0),
            updated_at = NOW()
        WHERE quiz_id = $1;
      `,
      [quizId]
    );
  }

  async createQuizQuestion(quizId: number, input: AdminQuizQuestionInput, createdBy: number) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const quizExists = await client.query(
        `SELECT quiz_type FROM "Quiz" WHERE quiz_id = $1 AND deleted_at IS NULL;`,
        [quizId]
      );
      if (!quizExists.rowCount) {
        await client.query("ROLLBACK");
        return null;
      }

      const questionResult = await client.query(
        `
          INSERT INTO "Question" (
            question_text, question_type, difficulty_level, explanation, points,
            jlpt_level, section_type, image_asset_id, image_url, audio_asset_id, audio_url,
            created_by, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
          RETURNING question_id;
        `,
        [
          input.question_text,
          input.question_type,
          input.difficulty_level ?? null,
          input.explanation ?? null,
          input.points,
          input.jlpt_level ?? null,
          input.section_type ?? null,
          input.image_asset_id ?? null,
          input.image_url ?? null,
          input.audio_asset_id ?? null,
          input.audio_url ?? null,
          createdBy,
        ]
      );
      const questionId = questionResult.rows[0].question_id;

      await client.query(
        `
          INSERT INTO "QuizQuestion" (quiz_id, question_id, order_index, marks)
          VALUES ($1, $2, $3, $4);
        `,
        [quizId, questionId, input.order_index ?? null, input.marks]
      );

      for (const option of input.options) {
        await client.query(
          `
            INSERT INTO "Option" (question_id, option_text, is_correct, explanation, created_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW(), NOW());
          `,
          [questionId, option.option_text, option.is_correct, option.explanation ?? null]
        );
      }

      await this.recalculateQuizTotalMarks(client, quizId);
      await client.query("COMMIT");
      return (await this.listQuizQuestions(quizId)).find((question) => question.question_id === questionId) ?? null;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async updateQuizQuestion(quizId: number, questionId: number, input: AdminQuizQuestionInput) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

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
            AND q.deleted_at IS NULL;
        `,
        [quizId, questionId]
      );
      if (!existing.rowCount) {
        await client.query("ROLLBACK");
        return null;
      }

      await client.query(
        `
          UPDATE "Question"
          SET question_text = $1,
              question_type = $2,
              difficulty_level = $3,
              explanation = $4,
              points = $5,
              jlpt_level = $6,
              section_type = $7,
              image_asset_id = $8,
              image_url = $9,
              audio_asset_id = $10,
              audio_url = $11,
              updated_at = NOW()
          WHERE question_id = $12;
        `,
        [
          input.question_text,
          input.question_type,
          input.difficulty_level ?? null,
          input.explanation ?? null,
          input.points,
          input.jlpt_level ?? null,
          input.section_type ?? null,
          input.image_asset_id ?? null,
          input.image_url ?? null,
          input.audio_asset_id ?? null,
          input.audio_url ?? null,
          questionId,
        ]
      );
      await client.query(
        `UPDATE "QuizQuestion" SET order_index = $1, marks = $2 WHERE quiz_id = $3 AND question_id = $4 AND deleted_at IS NULL;`,
        [input.order_index ?? null, input.marks, quizId, questionId]
      );

      const retainedOptionIds: number[] = [];
      for (const option of input.options) {
        if (option.option_id) {
          await client.query(
            `
              UPDATE "Option"
              SET option_text = $1, is_correct = $2, explanation = $3, updated_at = NOW()
              WHERE option_id = $4 AND question_id = $5;
            `,
            [option.option_text, option.is_correct, option.explanation ?? null, option.option_id, questionId]
          );
          retainedOptionIds.push(option.option_id);
        } else {
          const createdOption = await client.query(
            `
              INSERT INTO "Option" (question_id, option_text, is_correct, explanation, created_at, updated_at)
              VALUES ($1, $2, $3, $4, NOW(), NOW())
              RETURNING option_id;
            `,
            [questionId, option.option_text, option.is_correct, option.explanation ?? null]
          );
          retainedOptionIds.push(createdOption.rows[0].option_id);
        }
      }

      const referencedRemovedOptions = await client.query(
        `
          SELECT 1
          FROM "Option" o
          WHERE o.question_id = $1
            AND NOT (o.option_id = ANY($2::int[]))
            AND EXISTS (SELECT 1 FROM "UserAnswer" ua WHERE ua.option_id = o.option_id)
          LIMIT 1;
        `,
        [questionId, retainedOptionIds]
      );

      if (referencedRemovedOptions.rowCount) {
        const error = new Error("Cannot remove options that already have learner answers");
        (error as Error & { status?: number }).status = 409;
        throw error;
      }

      await client.query(
        `
          DELETE FROM "Option"
          WHERE question_id = $1
            AND NOT (option_id = ANY($2::int[]));
        `,
        [questionId, retainedOptionIds]
      );

      await this.recalculateQuizTotalMarks(client, quizId);
      await client.query("COMMIT");
      return (await this.listQuizQuestions(quizId)).find((question) => question.question_id === questionId) ?? null;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async updateQuizQuestionOrder(quizId: number, questionId: number, orderIndex: number | null): Promise<boolean> {
    const result = await databaseService.executeQuery(
      `
        UPDATE "QuizQuestion" qq
        SET order_index = $1
        FROM "Quiz" q
        WHERE qq.quiz_id = q.quiz_id
          AND qq.quiz_id = $2
          AND qq.question_id = $3
          AND qq.deleted_at IS NULL
          AND q.deleted_at IS NULL;
      `,
      [orderIndex, quizId, questionId]
    );
    return Boolean(result.rowCount);
  }

  async deleteQuizQuestion(quizId: number, questionId: number): Promise<boolean> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
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
            AND q.deleted_at IS NULL;
        `,
        [quizId, questionId]
      );
      if (!existing.rowCount) {
        await client.query("ROLLBACK");
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
      await this.recalculateQuizTotalMarks(client, quizId);
      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async listJlptExams(params: AdminListParams) {
    const { limit, offset } = withLimitOffset(params);
    const direction = orderDirection(params);
    const values: unknown[] = [];
    const where: string[] = [`e.deleted_at IS NULL`];

    if (params.search?.trim()) {
      values.push(`%${params.search.trim()}%`);
      where.push(`e.title ILIKE $${values.length}`);
    }

    values.push(limit, offset);
    const result = await databaseService.executeQuery(
      `
        SELECT e.exam_id, e.title, e.jlpt_level, e.year, e.duration_minutes, e.created_by,
               e.created_at, e.updated_at,
               COUNT(DISTINCT s.section_id)::int AS section_count,
               COUNT(DISTINCT jsq.question_id)::int AS question_count
        FROM "JLPTExam" e
        LEFT JOIN "JLPTSection" s ON s.exam_id = e.exam_id AND s.deleted_at IS NULL
        LEFT JOIN "JLPTSectionQuestion" jsq ON jsq.section_id = s.section_id AND jsq.deleted_at IS NULL
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        GROUP BY e.exam_id
        ORDER BY e.exam_id ${direction}
        LIMIT $${values.length - 1} OFFSET $${values.length};
      `,
      values
    );
    return result.rows;
  }

  async createJlptExam(input: {
    title: string;
    jlpt_level: JlptLevel;
    year: number | null;
    duration_minutes: number | null;
    created_by: number;
    sections: AdminJlptSectionInput[];
  }) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const examResult = await client.query(
        `
          INSERT INTO "JLPTExam" (title, jlpt_level, year, duration_minutes, created_by, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          RETURNING exam_id, title, jlpt_level, year, duration_minutes, created_by, created_at, updated_at;
        `,
        [input.title, input.jlpt_level, input.year, input.duration_minutes, input.created_by]
      );
      const exam = examResult.rows[0];

      for (const section of input.sections) {
        await client.query(
          `
            INSERT INTO "JLPTSection" (
              exam_id, title, section_type, section_order, duration_minutes, audio_asset_id, audio_url, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW());
          `,
          [
            exam.exam_id,
            section.title,
            section.section_type,
            section.section_order,
            section.duration_minutes ?? null,
            section.section_type === "listening" ? section.audio_asset_id ?? null : null,
            section.section_type === "listening" ? section.audio_url ?? null : null,
          ]
        );
      }

      await client.query("COMMIT");
      return exam;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async updateJlptExam(
    examId: number,
    input: Partial<{ title: string; jlpt_level: JlptLevel; year: number | null; duration_minutes: number | null }>
  ) {
    const updates: string[] = [];
    const values: unknown[] = [];
    const fields = ["title", "jlpt_level", "year", "duration_minutes"] as const;

    fields.forEach((field) => {
      if (!isUndefined(input[field])) {
        values.push(input[field]);
        updates.push(`${field} = $${values.length}`);
      }
    });

    if (!updates.length) return null;
    values.push(examId);
    const result = await databaseService.executeQuery(
      `
        UPDATE "JLPTExam"
        SET ${updates.join(", ")}, updated_at = NOW()
        WHERE exam_id = $${values.length}
          AND deleted_at IS NULL
        RETURNING exam_id, title, jlpt_level, year, duration_minutes, created_by, created_at, updated_at;
      `,
      values
    );
    return result.rows[0] || null;
  }

  async deleteJlptExam(examId: number): Promise<boolean> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const existing = await client.query(`SELECT exam_id FROM "JLPTExam" WHERE exam_id = $1 AND deleted_at IS NULL;`, [examId]);
      if (!existing.rowCount) {
        await client.query("ROLLBACK");
        return false;
      }

      await client.query(
        `
          UPDATE "JLPTSectionQuestion"
          SET deleted_at = COALESCE(deleted_at, NOW())
          WHERE section_id IN (SELECT section_id FROM "JLPTSection" WHERE exam_id = $1)
            AND deleted_at IS NULL;
        `,
        [examId]
      );
      await client.query(
        `
          UPDATE "JLPTSection"
          SET deleted_at = COALESCE(deleted_at, NOW()),
              updated_at = NOW()
          WHERE exam_id = $1
            AND deleted_at IS NULL;
        `,
        [examId]
      );
      await client.query(
        `
          UPDATE "JLPTExam"
          SET deleted_at = COALESCE(deleted_at, NOW()),
              updated_at = NOW()
          WHERE exam_id = $1
            AND deleted_at IS NULL;
        `,
        [examId]
      );
      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async listJlptSections(examId: number) {
    const result = await databaseService.executeQuery(
      `
        SELECT s.section_id, s.exam_id, s.title, s.section_type, s.section_order, s.duration_minutes,
               s.audio_asset_id, s.audio_url, s.deleted_at, s.updated_at,
               COUNT(jsq.question_id)::int AS question_count
        FROM "JLPTSection" s
        JOIN "JLPTExam" e ON e.exam_id = s.exam_id
        LEFT JOIN "JLPTSectionQuestion" jsq ON jsq.section_id = s.section_id AND jsq.deleted_at IS NULL
        WHERE s.exam_id = $1
          AND s.deleted_at IS NULL
          AND e.deleted_at IS NULL
        GROUP BY s.section_id
        ORDER BY s.section_order ASC NULLS LAST, s.section_id ASC;
      `,
      [examId]
    );
    return result.rows;
  }

  async createJlptSection(examId: number, input: AdminJlptSectionInput) {
    const result = await databaseService.executeQuery(
      `
        INSERT INTO "JLPTSection" (
          exam_id, title, section_type, section_order, duration_minutes, audio_asset_id, audio_url, updated_at
        )
        SELECT $1, $2, $3, $4, $5, $6, $7, NOW()
        FROM "JLPTExam" e
        WHERE e.exam_id = $1
          AND e.deleted_at IS NULL
        RETURNING section_id, exam_id, title, section_type, section_order, duration_minutes,
                  audio_asset_id, audio_url, deleted_at, updated_at;
      `,
      [
        examId,
        input.title,
        input.section_type,
        input.section_order,
        input.duration_minutes ?? null,
        input.section_type === "listening" ? input.audio_asset_id ?? null : null,
        input.section_type === "listening" ? input.audio_url ?? null : null,
      ]
    );
    return result.rows[0] || null;
  }

  async updateJlptSection(sectionId: number, input: Partial<AdminJlptSectionInput>) {
    const updates: string[] = [];
    const values: unknown[] = [];
    const fields = ["title", "section_type", "section_order", "duration_minutes", "audio_asset_id", "audio_url"] as const;

    fields.forEach((field) => {
      if (!isUndefined(input[field])) {
        values.push(input[field]);
        updates.push(`${field} = $${values.length}`);
      }
    });

    if (!updates.length) return null;
    values.push(sectionId);
    const result = await databaseService.executeQuery(
      `
        UPDATE "JLPTSection" s
        SET ${updates.join(", ")}, updated_at = NOW()
        FROM "JLPTExam" e
        WHERE s.exam_id = e.exam_id
          AND s.section_id = $${values.length}
          AND s.deleted_at IS NULL
          AND e.deleted_at IS NULL
        RETURNING s.section_id, s.exam_id, s.title, s.section_type, s.section_order, s.duration_minutes,
                  s.audio_asset_id, s.audio_url, s.deleted_at, s.updated_at;
      `,
      values
    );
    return result.rows[0] || null;
  }

  async deleteJlptSection(sectionId: number): Promise<boolean> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const existing = await client.query(
        `
          SELECT s.section_id
          FROM "JLPTSection" s
          JOIN "JLPTExam" e ON e.exam_id = s.exam_id
          WHERE s.section_id = $1
            AND s.deleted_at IS NULL
            AND e.deleted_at IS NULL;
        `,
        [sectionId]
      );
      if (!existing.rowCount) {
        await client.query("ROLLBACK");
        return false;
      }

      await client.query(
        `
          UPDATE "JLPTSectionQuestion"
          SET deleted_at = COALESCE(deleted_at, NOW())
          WHERE section_id = $1
            AND deleted_at IS NULL;
        `,
        [sectionId]
      );
      await client.query(
        `
          UPDATE "JLPTSection"
          SET deleted_at = COALESCE(deleted_at, NOW()),
              updated_at = NOW()
          WHERE section_id = $1
            AND deleted_at IS NULL;
        `,
        [sectionId]
      );
      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async listJlptSectionQuestions(sectionId: number) {
    const questionResult = await databaseService.executeQuery(
      `
        SELECT q.question_id, q.question_text, q.question_type, q.difficulty_level, q.explanation,
               q.points, q.jlpt_level, q.section_type, q.image_asset_id, q.image_url, q.audio_asset_id, q.audio_url,
               jsq.order_index, COALESCE(q.points, 1) AS marks
        FROM "JLPTSectionQuestion" jsq
        JOIN "Question" q ON q.question_id = jsq.question_id
        JOIN "JLPTSection" s ON s.section_id = jsq.section_id
        JOIN "JLPTExam" e ON e.exam_id = s.exam_id
        WHERE jsq.section_id = $1
          AND jsq.deleted_at IS NULL
          AND q.deleted_at IS NULL
          AND s.deleted_at IS NULL
          AND e.deleted_at IS NULL
        ORDER BY jsq.order_index ASC NULLS LAST, jsq.id ASC;
      `,
      [sectionId]
    );
    const questionIds = questionResult.rows.map((row) => row.question_id);
    const optionsByQuestion = new Map<number, unknown[]>();

    if (questionIds.length) {
      const optionResult = await databaseService.executeQuery(
        `
          SELECT option_id, question_id, option_text, is_correct, explanation
          FROM "Option"
          WHERE question_id = ANY($1::int[])
          ORDER BY option_id ASC;
        `,
        [questionIds]
      );
      optionResult.rows.forEach((option) => {
        const options = optionsByQuestion.get(option.question_id) ?? [];
        options.push({ ...option, is_correct: Boolean(option.is_correct) });
        optionsByQuestion.set(option.question_id, options);
      });
    }

    return questionResult.rows.map((row) => ({
      ...row,
      points: Number(row.points),
      marks: Number(row.marks),
      options: optionsByQuestion.get(row.question_id) ?? [],
    }));
  }

  async createJlptSectionQuestion(sectionId: number, input: AdminQuizQuestionInput, createdBy: number) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const sectionResult = await client.query(
        `
          SELECT s.section_type
          FROM "JLPTSection" s
          JOIN "JLPTExam" e ON e.exam_id = s.exam_id
          WHERE s.section_id = $1
            AND s.deleted_at IS NULL
            AND e.deleted_at IS NULL;
        `,
        [sectionId]
      );
      if (!sectionResult.rowCount) {
        await client.query("ROLLBACK");
        return null;
      }
      const sectionType = sectionResult.rows[0].section_type as SectionType;

      const questionResult = await client.query(
        `
          INSERT INTO "Question" (
            question_text, question_type, difficulty_level, explanation, points,
            jlpt_level, section_type, image_asset_id, image_url, audio_asset_id, audio_url,
            created_by, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
          RETURNING question_id;
        `,
        [
          input.question_text,
          input.question_type,
          input.difficulty_level ?? null,
          input.explanation ?? null,
          input.points,
          input.jlpt_level ?? null,
          sectionType,
          input.image_asset_id ?? null,
          input.image_url ?? null,
          null,
          null,
          createdBy,
        ]
      );
      const questionId = questionResult.rows[0].question_id;

      await client.query(
        `
          INSERT INTO "JLPTSectionQuestion" (section_id, question_id, order_index)
          VALUES ($1, $2, $3);
        `,
        [sectionId, questionId, input.order_index ?? null]
      );

      for (const option of input.options) {
        await client.query(
          `
            INSERT INTO "Option" (question_id, option_text, is_correct, explanation, created_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW(), NOW());
          `,
          [questionId, option.option_text, option.is_correct, option.explanation ?? null]
        );
      }

      await client.query("COMMIT");
      return (await this.listJlptSectionQuestions(sectionId)).find((question) => question.question_id === questionId) ?? null;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async updateJlptSectionQuestion(sectionId: number, questionId: number, input: AdminQuizQuestionInput) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
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
            AND q.deleted_at IS NULL;
        `,
        [sectionId, questionId]
      );
      if (!existing.rowCount) {
        await client.query("ROLLBACK");
        return null;
      }
      const sectionType = existing.rows[0].section_type as SectionType;

      await client.query(
        `
          UPDATE "Question"
          SET question_text = $1,
              question_type = $2,
              difficulty_level = $3,
              explanation = $4,
              points = $5,
              jlpt_level = $6,
              section_type = $7,
              image_asset_id = $8,
              image_url = $9,
              audio_asset_id = $10,
              audio_url = $11,
              updated_at = NOW()
          WHERE question_id = $12;
        `,
        [
          input.question_text,
          input.question_type,
          input.difficulty_level ?? null,
          input.explanation ?? null,
          input.points,
          input.jlpt_level ?? null,
          sectionType,
          input.image_asset_id ?? null,
          input.image_url ?? null,
          null,
          null,
          questionId,
        ]
      );
      await client.query(
        `UPDATE "JLPTSectionQuestion" SET order_index = $1 WHERE section_id = $2 AND question_id = $3 AND deleted_at IS NULL;`,
        [input.order_index ?? null, sectionId, questionId]
      );

      const retainedOptionIds: number[] = [];
      for (const option of input.options) {
        if (option.option_id) {
          await client.query(
            `
              UPDATE "Option"
              SET option_text = $1, is_correct = $2, explanation = $3, updated_at = NOW()
              WHERE option_id = $4 AND question_id = $5;
            `,
            [option.option_text, option.is_correct, option.explanation ?? null, option.option_id, questionId]
          );
          retainedOptionIds.push(option.option_id);
        } else {
          const createdOption = await client.query(
            `
              INSERT INTO "Option" (question_id, option_text, is_correct, explanation, created_at, updated_at)
              VALUES ($1, $2, $3, $4, NOW(), NOW())
              RETURNING option_id;
            `,
            [questionId, option.option_text, option.is_correct, option.explanation ?? null]
          );
          retainedOptionIds.push(createdOption.rows[0].option_id);
        }
      }

      const referencedRemovedOptions = await client.query(
        `
          SELECT 1
          FROM "Option" o
          WHERE o.question_id = $1
            AND NOT (o.option_id = ANY($2::int[]))
            AND EXISTS (SELECT 1 FROM "UserAnswer" ua WHERE ua.option_id = o.option_id)
          LIMIT 1;
        `,
        [questionId, retainedOptionIds]
      );

      if (referencedRemovedOptions.rowCount) {
        const error = new Error("Cannot remove options that already have learner answers");
        (error as Error & { status?: number }).status = 409;
        throw error;
      }

      await client.query(
        `
          DELETE FROM "Option"
          WHERE question_id = $1
            AND NOT (option_id = ANY($2::int[]));
        `,
        [questionId, retainedOptionIds]
      );

      await client.query("COMMIT");
      return (await this.listJlptSectionQuestions(sectionId)).find((question) => question.question_id === questionId) ?? null;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async updateJlptSectionQuestionOrder(sectionId: number, questionId: number, orderIndex: number | null): Promise<boolean> {
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
          AND e.deleted_at IS NULL;
      `,
      [orderIndex, sectionId, questionId]
    );
    return Boolean(result.rowCount);
  }

  async deleteJlptSectionQuestion(sectionId: number, questionId: number): Promise<boolean> {
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
          AND e.deleted_at IS NULL;
      `,
      [sectionId, questionId]
    );
    return Boolean(result.rowCount);
  }

  async listBlogs(params: AdminListParams) {
    if (!(await this.hasBlogTable())) {
      return [];
    }

    const { limit, offset } = withLimitOffset(params);
    const direction = orderDirection(params);
    const values: unknown[] = [];
    const where: string[] = [];

    if (params.search?.trim()) {
      values.push(`%${params.search.trim()}%`);
      where.push(`(title ILIKE $${values.length} OR excerpt ILIKE $${values.length} OR category ILIKE $${values.length})`);
    }

    if (params.status && params.status !== "all") {
      values.push(params.status);
      where.push(`status = $${values.length}`);
    }

    values.push(limit, offset);
    const result = await databaseService.executeQuery(
      `
        SELECT blog_id, title, slug, excerpt, content, category, cover_asset_id, image_url, status, author_id, published_at, created_at, updated_at
        FROM "Blog"
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY blog_id ${direction}
        LIMIT $${values.length - 1} OFFSET $${values.length};
      `,
      values
    );
    return result.rows;
  }

  async createBlog(input: {
    title: string;
    slug: string;
    excerpt: string | null;
    content: string | null;
    category: string | null;
    cover_asset_id: number | null;
    image_url: string | null;
    status: BlogStatus;
    author_id: number;
  }) {
    if (!(await this.hasBlogTable())) {
      throw new Error('Blog table is not available. Create the "Blog" table from erd.sql first.');
    }

    const result = await databaseService.executeQuery(
      `
        INSERT INTO "Blog" (title, slug, excerpt, content, category, cover_asset_id, image_url, status, author_id, published_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CASE WHEN $8 = 'published' THEN NOW() ELSE NULL END, NOW(), NOW())
        RETURNING blog_id, title, slug, excerpt, content, category, cover_asset_id, image_url, status, author_id, published_at, created_at, updated_at;
      `,
      [input.title, input.slug, input.excerpt, input.content, input.category, input.cover_asset_id, input.image_url, input.status, input.author_id]
    );
    return result.rows[0];
  }

  async updateBlog(
    blogId: number,
    input: Partial<{
      title: string;
      slug: string;
      excerpt: string | null;
      content: string | null;
      category: string | null;
      cover_asset_id: number | null;
      image_url: string | null;
      status: BlogStatus;
    }>
  ) {
    if (!(await this.hasBlogTable())) {
      throw new Error('Blog table is not available. Create the "Blog" table from erd.sql first.');
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    const fields = ["title", "slug", "excerpt", "content", "category", "cover_asset_id", "image_url", "status"] as const;
    let statusParamIndex: number | null = null;

    fields.forEach((field) => {
      if (!isUndefined(input[field])) {
        values.push(input[field]);
        if (field === "status") statusParamIndex = values.length;
        updates.push(`${field} = $${values.length}`);
      }
    });

    if (!updates.length) return null;
    values.push(blogId);
    const result = await databaseService.executeQuery(
      `
        UPDATE "Blog"
        SET ${updates.join(", ")},
            published_at = CASE
              WHEN published_at IS NULL AND ${statusParamIndex ? `$${statusParamIndex} = 'published'` : "FALSE"} THEN NOW()
              ELSE published_at
            END,
            updated_at = NOW()
        WHERE blog_id = $${values.length}
        RETURNING blog_id, title, slug, excerpt, content, category, cover_asset_id, image_url, status, author_id, published_at, created_at, updated_at;
      `,
      values
    );
    return result.rows[0] || null;
  }
}

export default new AdminModel();
