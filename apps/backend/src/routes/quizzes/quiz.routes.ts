import { Router } from "express";
import quizController from "../../controllers/quizzes/quiz.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/http.js";

const router = Router();

router.get("/lessons/:lessonId", authMiddleware, asyncHandler(quizController.getLessonQuiz));

router.get("/courses/:courseId/final", authMiddleware, asyncHandler(quizController.getFinalQuiz));

router.post("/:quizId/start", authMiddleware, asyncHandler(quizController.startQuiz));

router.post("/:quizId/submit", authMiddleware, asyncHandler(quizController.submitQuiz));

export default router;
