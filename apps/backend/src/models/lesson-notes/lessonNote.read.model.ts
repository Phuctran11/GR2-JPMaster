import databaseService from "../../services/database.service.js";
import {
  buildUserNotesWhere,
  lessonNoteBaseSelect,
  type LessonNote,
  type LessonNoteFilters,
} from "./lessonNote.types.js";

export class LessonNoteReadModel {
  async getUserNotes(userId: number, filters: LessonNoteFilters = {}): Promise<LessonNote[]> {
    const { whereSql, values } = buildUserNotesWhere(userId, filters);

    const limit = Math.min(filters.limit ?? 20, 100);
    const offset = filters.offset ?? 0;
    values.push(limit, offset);
    const direction = filters.sortOrder === "oldest" ? "ASC" : "DESC";

    const result = await databaseService.executeQuery(
      `
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
        WHERE ${whereSql}
        ORDER BY ln.is_pinned DESC, ln.created_at ${direction}, ln.note_id ${direction}
        LIMIT $${values.length - 1} OFFSET $${values.length};
      `,
      values
    );
    return result.rows;
  }

  async countUserNotes(userId: number, filters: LessonNoteFilters = {}): Promise<number> {
    const { whereSql, values } = buildUserNotesWhere(userId, filters);
    const result = await databaseService.executeQuery(
      `
        SELECT COUNT(*)::int AS total_count
        FROM "LessonNote" ln
        WHERE ${whereSql};
      `,
      values
    );
    return Number(result.rows[0]?.total_count || 0);
  }

  async getUserNoteTypeCounts(userId: number, filters: Omit<LessonNoteFilters, "noteType" | "limit" | "offset" | "sortOrder"> = {}) {
    const { whereSql, values } = buildUserNotesWhere(userId, filters);
    const result = await databaseService.executeQuery(
      `
        SELECT ln.note_type, COUNT(*)::int AS count
        FROM "LessonNote" ln
        WHERE ${whereSql}
        GROUP BY ln.note_type;
      `,
      values
    );

    return result.rows;
  }

  async getUserNoteById(userId: number, noteId: number): Promise<LessonNote | null> {
    const result = await databaseService.executeQuery(
      `
        SELECT ${lessonNoteBaseSelect}
        FROM "LessonNote"
        WHERE note_id = $1 AND user_id = $2 AND is_deleted = FALSE;
      `,
      [noteId, userId]
    );
    return result.rows[0] ?? null;
  }
}

export default new LessonNoteReadModel();

