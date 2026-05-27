import { WhereBuilder } from "../sqlHelpers.js";

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
  sortOrder?: "newest" | "oldest";
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

export const lessonNoteBaseSelect = `
  note_id, user_id, lesson_id, question_id, note_type, note_content, selected_text,
  video_timestamp_seconds, is_pinned, is_deleted, created_at, updated_at
`;

export const buildUserNotesWhere = (userId: number, filters: LessonNoteFilters = {}) => {
  const where = new WhereBuilder([`ln.user_id = $1`, `ln.is_deleted = FALSE`], [userId])
    .addIf(Boolean(filters.noteType), `ln.note_type = ?`, filters.noteType)
    .addIf(Boolean(filters.lessonId), `ln.lesson_id = ?`, filters.lessonId)
    .addIf(Boolean(filters.questionId), `ln.question_id = ?`, filters.questionId)
    .addIf(filters.pinned != null, `ln.is_pinned = ?`, filters.pinned);

  if (filters.search?.trim()) {
    const search = `%${filters.search.trim()}%`;
    where.add(`(ln.note_content ILIKE ? OR ln.selected_text ILIKE ?)`, search, search);
  }

  return { whereSql: where.toSql(), values: where.values };
};

