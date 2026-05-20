import databaseService from "../services/database.service.js";

export type LessonNoteType = "text_note" | "video_note" | "highlight" | "question_note" | "ai_summary";

export interface LessonNote {
  note_id: number;
  user_id: number;
  lesson_id: number | null;
  question_id: number | null;
  note_type: LessonNoteType;
  note_content: string;
  selected_text: string | null;
  video_timestamp_seconds: number | null;
  is_pinned: boolean;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
  lesson_title?: string | null;
  course_id?: number | null;
  course_title?: string | null;
  quiz_type?: string | null;
  question_text?: string | null;
}

export interface LessonNoteFilters {
  noteType?: LessonNoteType;
  lessonId?: number | null;
  questionId?: number;
  pinned?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CreateLessonNoteInput {
  lessonId?: number | null;
  questionId?: number | null;
  noteType: LessonNoteType;
  noteContent: string;
  selectedText?: string | null;
  videoTimestampSeconds?: number | null;
  isPinned?: boolean;
}

export interface UpdateLessonNoteInput {
  noteContent?: string;
  selectedText?: string | null;
  videoTimestampSeconds?: number | null;
  isPinned?: boolean;
}

export const LESSON_NOTE_TYPES: LessonNoteType[] = [
  "text_note",
  "video_note",
  "highlight",
  "question_note",
  "ai_summary",
];

export class LessonNoteModel {
  private async findExistingScopedNote(userId: number, input: CreateLessonNoteInput): Promise<LessonNote | null> {
    const values: unknown[] = [userId, input.noteType];
    let scope = "";

    if (input.noteType === "question_note") {
      if (!input.questionId) return null;
      values.push(input.questionId);
      scope = `question_id = $${values.length}`;
    } else if (input.noteType === "video_note") {
      if (!input.lessonId || input.videoTimestampSeconds == null) return null;
      values.push(input.lessonId, input.videoTimestampSeconds);
      scope = `lesson_id = $${values.length - 1} AND video_timestamp_seconds = $${values.length}`;
    } else if (input.noteType === "highlight") {
      if (!input.lessonId || !input.selectedText?.trim()) return null;
      values.push(input.lessonId, input.selectedText.trim());
      scope = `lesson_id = $${values.length - 1} AND selected_text = $${values.length}`;
    } else {
      if (!input.lessonId) return null;
      values.push(input.lessonId);
      scope = `lesson_id = $${values.length}`;
    }

    const query = `
      SELECT note_id, user_id, lesson_id, question_id, note_type, note_content, selected_text,
        video_timestamp_seconds, is_pinned, is_deleted, created_at, updated_at
      FROM "LessonNote"
      WHERE user_id = $1 AND note_type = $2 AND is_deleted = FALSE AND ${scope}
      LIMIT 1;
    `;
    const result = await databaseService.executeQuery(query, values);
    return result.rows[0] ?? null;
  }

  async createNote(userId: number, input: CreateLessonNoteInput): Promise<LessonNote> {
    const existing = await this.findExistingScopedNote(userId, input);
    if (existing) {
      const updated = await this.updateNote(userId, existing.note_id, {
        noteContent: input.noteContent,
        selectedText: input.selectedText ?? existing.selected_text,
        videoTimestampSeconds: input.videoTimestampSeconds ?? existing.video_timestamp_seconds,
        isPinned: input.isPinned ?? existing.is_pinned,
      });
      return updated ?? existing;
    }

    const query = `
      INSERT INTO "LessonNote" (
        user_id,
        lesson_id,
        question_id,
        note_type,
        note_content,
        selected_text,
        video_timestamp_seconds,
        is_pinned,
        is_deleted,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, NOW(), NOW())
      RETURNING note_id, user_id, lesson_id, question_id, note_type, note_content, selected_text,
        video_timestamp_seconds, is_pinned, is_deleted, created_at, updated_at;
    `;

    const result = await databaseService.executeQuery(query, [
      userId,
      input.lessonId ?? null,
      input.questionId ?? null,
      input.noteType,
      input.noteContent,
      input.selectedText ?? null,
      input.videoTimestampSeconds ?? null,
      input.isPinned ?? false,
    ]);

    return result.rows[0];
  }

  async getUserNotes(userId: number, filters: LessonNoteFilters = {}): Promise<LessonNote[]> {
    const where = [`ln.user_id = $1`, `ln.is_deleted = FALSE`];
    const values: unknown[] = [userId];

    if (filters.noteType) {
      values.push(filters.noteType);
      where.push(`ln.note_type = $${values.length}`);
    }

    if (filters.lessonId) {
      values.push(filters.lessonId);
      where.push(`ln.lesson_id = $${values.length}`);
    }

    if (filters.questionId) {
      values.push(filters.questionId);
      where.push(`ln.question_id = $${values.length}`);
    }

    if (filters.pinned != null) {
      values.push(filters.pinned);
      where.push(`ln.is_pinned = $${values.length}`);
    }

    if (filters.search?.trim()) {
      values.push(`%${filters.search.trim()}%`);
      where.push(`(ln.note_content ILIKE $${values.length} OR ln.selected_text ILIKE $${values.length})`);
    }

    const limit = Math.min(filters.limit ?? 20, 100);
    const offset = filters.offset ?? 0;
    values.push(limit, offset);

    const query = `
      SELECT
        ln.note_id,
        ln.user_id,
        ln.lesson_id,
        ln.question_id,
        ln.note_type,
        ln.note_content,
        ln.selected_text,
        ln.video_timestamp_seconds,
        ln.is_pinned,
        ln.is_deleted,
        ln.created_at,
        ln.updated_at,
        l.title AS lesson_title,
        COALESCE(l.course_id, note_quiz.course_id) AS course_id,
        COALESCE(c.title, qc.title) AS course_title,
        note_quiz.quiz_type,
        q.question_text
      FROM "LessonNote" ln
      LEFT JOIN "Lesson" l ON l.lesson_id = ln.lesson_id
      LEFT JOIN "Course" c ON c.course_id = l.course_id
      LEFT JOIN "Question" q ON q.question_id = ln.question_id
      LEFT JOIN LATERAL (
        SELECT COALESCE(qz.course_id, ql.course_id) AS course_id, qz.quiz_type
        FROM "QuizQuestion" qq
        JOIN "Quiz" qz ON qz.quiz_id = qq.quiz_id
        LEFT JOIN "Lesson" ql ON ql.lesson_id = qz.lesson_id
        WHERE qq.question_id = ln.question_id
        ORDER BY
          CASE WHEN qz.quiz_type = 'final_test' THEN 0 ELSE 1 END,
          qz.quiz_id DESC
        LIMIT 1
      ) note_quiz ON TRUE
      LEFT JOIN "Course" qc ON qc.course_id = note_quiz.course_id
      WHERE ${where.join(" AND ")}
      ORDER BY ln.is_pinned DESC, ln.created_at DESC
      LIMIT $${values.length - 1} OFFSET $${values.length};
    `;

    const result = await databaseService.executeQuery(query, values);
    return result.rows;
  }

  async getUserNoteById(userId: number, noteId: number): Promise<LessonNote | null> {
    const query = `
      SELECT note_id, user_id, lesson_id, question_id, note_type, note_content, selected_text,
        video_timestamp_seconds, is_pinned, is_deleted, created_at, updated_at
      FROM "LessonNote"
      WHERE note_id = $1 AND user_id = $2 AND is_deleted = FALSE;
    `;
    const result = await databaseService.executeQuery(query, [noteId, userId]);
    return result.rows[0] ?? null;
  }

  async updateNote(userId: number, noteId: number, input: UpdateLessonNoteInput): Promise<LessonNote | null> {
    const existing = await this.getUserNoteById(userId, noteId);
    if (!existing) return null;

    const query = `
      UPDATE "LessonNote"
      SET
        note_content = $1,
        selected_text = $2,
        video_timestamp_seconds = $3,
        is_pinned = $4,
        updated_at = NOW()
      WHERE note_id = $5 AND user_id = $6 AND is_deleted = FALSE
      RETURNING note_id, user_id, lesson_id, question_id, note_type, note_content, selected_text,
        video_timestamp_seconds, is_pinned, is_deleted, created_at, updated_at;
    `;

    const result = await databaseService.executeQuery(query, [
      input.noteContent ?? existing.note_content,
      input.selectedText !== undefined ? input.selectedText : existing.selected_text,
      input.videoTimestampSeconds !== undefined ? input.videoTimestampSeconds : existing.video_timestamp_seconds,
      input.isPinned !== undefined ? input.isPinned : existing.is_pinned,
      noteId,
      userId,
    ]);

    return result.rows[0] ?? null;
  }

  async setPinned(userId: number, noteId: number, isPinned: boolean): Promise<LessonNote | null> {
    const query = `
      UPDATE "LessonNote"
      SET is_pinned = $1, updated_at = NOW()
      WHERE note_id = $2 AND user_id = $3 AND is_deleted = FALSE
      RETURNING note_id, user_id, lesson_id, question_id, note_type, note_content, selected_text,
        video_timestamp_seconds, is_pinned, is_deleted, created_at, updated_at;
    `;
    const result = await databaseService.executeQuery(query, [isPinned, noteId, userId]);
    return result.rows[0] ?? null;
  }

  async softDeleteNote(userId: number, noteId: number): Promise<boolean> {
    const query = `
      UPDATE "LessonNote"
      SET is_deleted = TRUE, updated_at = NOW()
      WHERE note_id = $1 AND user_id = $2 AND is_deleted = FALSE;
    `;
    const result = await databaseService.executeQuery(query, [noteId, userId]);
    return (result.rowCount ?? 0) > 0;
  }
}

export default new LessonNoteModel();
