import { Router } from "express";
import flashcardController from "../../controllers/flashcards/flashcard.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/http.js";

const router = Router();

router.use(authMiddleware);

router.get("/collections", asyncHandler(flashcardController.getMyCollections));
router.get("/collections/public", asyncHandler(flashcardController.getPublicCollections));
router.post("/collections", asyncHandler(flashcardController.createCollection));
router.get("/collections/:collectionId", asyncHandler(flashcardController.getCollection));
router.put("/collections/:collectionId", asyncHandler(flashcardController.updateCollection));
router.delete("/collections/:collectionId", asyncHandler(flashcardController.deleteCollection));
router.get("/collections/:collectionId/cards", asyncHandler(flashcardController.getFlashcardsByCollection));
router.get("/lessons/:lessonId", asyncHandler(flashcardController.getFlashcardsByLesson));

router.post("/", asyncHandler(flashcardController.createFlashcard));
router.get("/:id", asyncHandler(flashcardController.getFlashcard));
router.put("/:id", asyncHandler(flashcardController.updateFlashcard));
router.delete("/:id", asyncHandler(flashcardController.deleteFlashcard));

export default router;
