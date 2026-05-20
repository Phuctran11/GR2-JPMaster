import { Router } from "express";
import aiController from "../controllers/ai.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.post("/flashcard", (req, res, next) => aiController.askFlashcard(req, res, next));
router.post("/lesson", (req, res, next) => aiController.askLesson(req, res, next));

export default router;
