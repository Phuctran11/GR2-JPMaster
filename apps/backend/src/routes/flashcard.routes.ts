import { Router } from "express";
import flashcardController from "../controllers/flashcard.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/collections", (req, res, next) =>
  flashcardController.getMyCollections(req, res, next)
);
router.get("/collections/public", (req, res, next) =>
  flashcardController.getPublicCollections(req, res, next)
);
router.post("/collections", (req, res, next) =>
  flashcardController.createCollection(req, res, next)
);
router.get("/collections/:collectionId", (req, res, next) =>
  flashcardController.getCollection(req, res, next)
);
router.put("/collections/:collectionId", (req, res, next) =>
  flashcardController.updateCollection(req, res, next)
);
router.delete("/collections/:collectionId", (req, res, next) =>
  flashcardController.deleteCollection(req, res, next)
);
router.get("/collections/:collectionId/cards", (req, res, next) =>
  flashcardController.getFlashcardsByCollection(req, res, next)
);
router.get("/lessons/:lessonId", (req, res, next) =>
  flashcardController.getFlashcardsByLesson(req, res, next)
);

router.post("/", (req, res, next) =>
  flashcardController.createFlashcard(req, res, next)
);
router.get("/:id", (req, res, next) =>
  flashcardController.getFlashcard(req, res, next)
);
router.put("/:id", (req, res, next) =>
  flashcardController.updateFlashcard(req, res, next)
);
router.delete("/:id", (req, res, next) =>
  flashcardController.deleteFlashcard(req, res, next)
);

export default router;
