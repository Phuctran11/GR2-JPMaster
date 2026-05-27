import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import lessonNoteService from "../../services/lesson-notes/lessonNote.service.js";
import { created, message, ok, paginated, requireUser } from "../../utils/http.js";
import { parsePagination, parsePositiveInt } from "../../validators/common.validator.js";

export class LessonNoteController {
  async createNote(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);

    const note = await lessonNoteService.createNote(user.user_id, req.body);

    return created(res, "Lesson note created successfully", note);
  }

  async getMyNotes(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);

    const { limit, offset } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });
    const { notes, totalCount, typeCounts } = await lessonNoteService.getMyNotes(user.user_id, req.query, {
      limit,
      offset,
    });

    return paginated(res, notes, totalCount, { counts_by_type: typeCounts });
  }

  async updateNote(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);

    const noteId = parsePositiveInt(req.params.noteId, "note ID");
    const note = await lessonNoteService.updateNote(user.user_id, noteId, req.body);

    return ok(res, note, { message: "Lesson note updated successfully" });
  }

  async togglePinned(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);

    const noteId = parsePositiveInt(req.params.noteId, "note ID");
    const note = await lessonNoteService.togglePinned(user.user_id, noteId, req.body.is_pinned);

    return ok(res, note, { message: note.is_pinned ? "Lesson note pinned" : "Lesson note unpinned" });
  }

  async deleteNote(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);

    const noteId = parsePositiveInt(req.params.noteId, "note ID");
    await lessonNoteService.deleteNote(user.user_id, noteId);

    return message(res, "Lesson note deleted successfully");
  }
}

export default new LessonNoteController();
