import { Router } from "express";
import analyticsController from "../../controllers/analytics/analytics.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/http.js";

const router = Router();

router.use(authMiddleware);
router.get("/me/summary", asyncHandler(analyticsController.getSummary));
router.get("/me/study-time", asyncHandler(analyticsController.getStudyTime));
router.get("/me/course-progress", asyncHandler(analyticsController.getCourseProgress));
router.get("/me/quiz-performance", asyncHandler(analyticsController.getQuizPerformance));
router.get("/me/jlpt-performance", asyncHandler(analyticsController.getJlptPerformance));

export default router;
