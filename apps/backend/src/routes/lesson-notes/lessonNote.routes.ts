import { Router } from "express";
import lessonNoteController from "../../controllers/lesson-notes/lessonNote.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/http.js";

const router = Router();

router.use(authMiddleware);

router.get("/", asyncHandler(lessonNoteController.getMyNotes));
router.post("/", asyncHandler(lessonNoteController.createNote));
router.put("/:noteId", asyncHandler(lessonNoteController.updateNote));
router.patch("/:noteId/pin", asyncHandler(lessonNoteController.togglePinned));
router.delete("/:noteId", asyncHandler(lessonNoteController.deleteNote));

export default router;
