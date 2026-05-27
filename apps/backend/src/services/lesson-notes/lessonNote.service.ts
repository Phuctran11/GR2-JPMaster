import lessonNoteModel, {
  LESSON_NOTE_TYPES,
  LessonNoteFilters,
  LessonNoteType,
} from "../../models/lesson-notes/lessonNote.model.js";
import { ApiError } from "../../utils/http.js";
import { BodyInput, optionalNumber, QueryInput, requireString } from "../../validators/common.validator.js";

const isValidNoteType = (value: unknown): value is LessonNoteType =>
  typeof value === "string" && LESSON_NOTE_TYPES.includes(value as LessonNoteType);

const optionalFilterNumber = (value: unknown) => optionalNumber(value) ?? undefined;

const parsePinnedFilter = (value: unknown) => (value === "true" ? true : value === "false" ? false : undefined);

export class LessonNoteService {
  async createNote(userId: number, body: BodyInput) {
    const {
      lesson_id,
      question_id,
      note_type,
      note_content,
      selected_text,
      video_timestamp_seconds,
      is_pinned,
    } = body;

    if (!isValidNoteType(note_type)) {
      throw new ApiError(400, "Invalid note_type");
    }

    const noteContent = requireString(note_content);
    const selectedText = requireString(selected_text);

    if (!noteContent) {
      throw new ApiError(400, "note_content is required");
    }

    if (note_type === "question_note" && !optionalNumber(question_id)) {
      throw new ApiError(400, "question_id is required for question notes");
    }

    const lessonId = optionalNumber(lesson_id) ?? null;
    if (note_type !== "question_note" && !lessonId) {
      throw new ApiError(400, "lesson_id is required for this note type");
    }

    if (note_type === "highlight" && !selectedText) {
      throw new ApiError(400, "selected_text is required for highlight notes");
    }

    if (note_type === "video_note" && optionalNumber(video_timestamp_seconds) == null) {
      throw new ApiError(400, "video_timestamp_seconds is required for video notes");
    }

    return lessonNoteModel.createNote(userId, {
      lessonId,
      questionId: optionalNumber(question_id) ?? null,
      noteType: note_type,
      noteContent,
      selectedText: selectedText || null,
      videoTimestampSeconds: optionalNumber(video_timestamp_seconds) ?? null,
      isPinned: Boolean(is_pinned),
    });
  }

  async getMyNotes(userId: number, query: QueryInput, pagination: { limit: number; offset: number }) {
    const noteType = query.note_type;
    if (noteType && !isValidNoteType(noteType)) {
      throw new ApiError(400, "Invalid note_type");
    }

    const baseFilters = {
      noteType: isValidNoteType(noteType) ? noteType : undefined,
      lessonId: optionalFilterNumber(query.lesson_id),
      questionId: optionalFilterNumber(query.question_id),
      pinned: parsePinnedFilter(query.pinned),
      search: typeof query.search === "string" ? query.search : undefined,
    } satisfies Omit<LessonNoteFilters, "limit" | "offset" | "sortOrder">;

    const notes = await lessonNoteModel.getUserNotes(userId, {
      ...baseFilters,
      sortOrder: query.sort_order === "oldest" ? "oldest" : "newest",
      limit: pagination.limit,
      offset: pagination.offset,
    });

    const [totalCount, typeCounts] = await Promise.all([
      lessonNoteModel.countUserNotes(userId, baseFilters),
      lessonNoteModel.getUserNoteTypeCounts(userId, {
        lessonId: baseFilters.lessonId,
        questionId: baseFilters.questionId,
        pinned: baseFilters.pinned,
        search: baseFilters.search,
      }),
    ]);

    return { notes, totalCount, typeCounts };
  }

  async updateNote(userId: number, noteId: number, body: BodyInput) {
    const note = await lessonNoteModel.updateNote(userId, noteId, {
      noteContent: typeof body.note_content === "string" ? body.note_content.trim() : undefined,
      selectedText: body.selected_text === undefined ? undefined : requireString(body.selected_text) || null,
      videoTimestampSeconds:
        body.video_timestamp_seconds === undefined ? undefined : optionalNumber(body.video_timestamp_seconds) ?? null,
      isPinned: body.is_pinned === undefined ? undefined : Boolean(body.is_pinned),
    });

    if (!note) {
      throw new ApiError(404, "Lesson note not found");
    }

    return note;
  }

  async togglePinned(userId: number, noteId: number, isPinned: unknown) {
    const note = await lessonNoteModel.setPinned(userId, noteId, Boolean(isPinned));
    if (!note) {
      throw new ApiError(404, "Lesson note not found");
    }

    return note;
  }

  async deleteNote(userId: number, noteId: number) {
    const deleted = await lessonNoteModel.softDeleteNote(userId, noteId);
    if (!deleted) {
      throw new ApiError(404, "Lesson note not found");
    }
  }
}

export default new LessonNoteService();
