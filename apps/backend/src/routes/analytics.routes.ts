import { Router } from "express";
import analyticsController from "../controllers/analytics.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);
router.get("/me/summary", analyticsController.getSummary.bind(analyticsController));
router.get("/me/study-time", analyticsController.getStudyTime.bind(analyticsController));
router.get("/me/course-progress", analyticsController.getCourseProgress.bind(analyticsController));
router.get("/me/quiz-performance", analyticsController.getQuizPerformance.bind(analyticsController));
router.get("/me/jlpt-performance", analyticsController.getJlptPerformance.bind(analyticsController));

export default router;
