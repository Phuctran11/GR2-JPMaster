import databaseService from "../../services/database.service.js";
import lessonNoteReadModel from "./lessonNote.read.model.js";
import {
  lessonNoteBaseSelect,
  type CreateLessonNoteInput,
  type LessonNote,
  type UpdateLessonNoteInput,
} from "./lessonNote.types.js";

const lessonNoteConflictUpdateSql = `
  DO UPDATE SET
    note_content = EXCLUDED.note_content,
    selected_text = COALESCE(EXCLUDED.selected_text, "LessonNote".selected_text),
    video_timestamp_seconds = COALESCE(EXCLUDED.video_timestamp_seconds, "LessonNote".video_timestamp_seconds),
    is_pinned = EXCLUDED.is_pinned,
    updated_at = NOW()
`;

const getCreateNoteConflictSql = (input: CreateLessonNoteInput) => {
  if (input.noteType === "question_note" && input.questionId) {
    return `
      ON CONFLICT (user_id, question_id)
      WHERE is_deleted = FALSE AND note_type = 'question_note'
      ${lessonNoteConflictUpdateSql}
    `;
  }

  if (input.noteType === "video_note" && input.lessonId && input.videoTimestampSeconds != null) {
    return `
      ON CONFLICT (user_id, lesson_id, video_timestamp_seconds)
      WHERE is_deleted = FALSE AND note_type = 'video_note'
      ${lessonNoteConflictUpdateSql}
    `;
  }

  if (input.noteType === "highlight" && input.lessonId && input.selectedText?.trim()) {
    return `
      ON CONFLICT (user_id, lesson_id, selected_text)
      WHERE is_deleted = FALSE AND note_type = 'highlight'
      ${lessonNoteConflictUpdateSql}
    `;
  }

  if ((input.noteType === "text_note" || input.noteType === "ai_summary") && input.lessonId) {
    return `
      ON CONFLICT (user_id, lesson_id, note_type)
      WHERE is_deleted = FALSE AND note_type IN ('text_note', 'ai_summary')
      ${lessonNoteConflictUpdateSql}
    `;
  }

  return "";
};

export class LessonNoteWriteModel {
  async createNote(userId: number, input: CreateLessonNoteInput): Promise<LessonNote> {
    const result = await databaseService.executeQuery(
      `
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
        ${getCreateNoteConflictSql(input)}
        RETURNING ${lessonNoteBaseSelect};
      `,
      [
        userId,
        input.lessonId ?? null,
        input.questionId ?? null,
        input.noteType,
        input.noteContent,
        input.selectedText ?? null,
        input.videoTimestampSeconds ?? null,
        input.isPinned ?? false,
      ]
    );

    return result.rows[0];
  }

  async updateNote(userId: number, noteId: number, input: UpdateLessonNoteInput): Promise<LessonNote | null> {
    const existing = await lessonNoteReadModel.getUserNoteById(userId, noteId);
    if (!existing) return null;

    const result = await databaseService.executeQuery(
      `
        UPDATE "LessonNote"
        SET
          note_content = $1,
          selected_text = $2,
          video_timestamp_seconds = $3,
          is_pinned = $4,
          updated_at = NOW()
        WHERE note_id = $5 AND user_id = $6 AND is_deleted = FALSE
        RETURNING ${lessonNoteBaseSelect};
      `,
      [
        input.noteContent ?? existing.note_content,
        input.selectedText !== undefined ? input.selectedText : existing.selected_text,
        input.videoTimestampSeconds !== undefined ? input.videoTimestampSeconds : existing.video_timestamp_seconds,
        input.isPinned !== undefined ? input.isPinned : existing.is_pinned,
        noteId,
        userId,
      ]
    );

    return result.rows[0] ?? null;
  }

  async setPinned(userId: number, noteId: number, isPinned: boolean): Promise<LessonNote | null> {
    const result = await databaseService.executeQuery(
      `
        UPDATE "LessonNote"
        SET is_pinned = $1, updated_at = NOW()
        WHERE note_id = $2 AND user_id = $3 AND is_deleted = FALSE
        RETURNING ${lessonNoteBaseSelect};
      `,
      [isPinned, noteId, userId]
    );
    return result.rows[0] ?? null;
  }

  async softDeleteNote(userId: number, noteId: number): Promise<boolean> {
    const result = await databaseService.executeQuery(
      `
        UPDATE "LessonNote"
        SET is_deleted = TRUE, updated_at = NOW()
        WHERE note_id = $1 AND user_id = $2 AND is_deleted = FALSE;
      `,
      [noteId, userId]
    );
    return (result.rowCount ?? 0) > 0;
  }
}

export default new LessonNoteWriteModel();
