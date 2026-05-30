import { Router } from "express";
import aiController from "../../controllers/ai/ai.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/http.js";

const router = Router();

router.use(authMiddleware);

router.post("/flashcard", asyncHandler(aiController.askFlashcard));

export default router;
