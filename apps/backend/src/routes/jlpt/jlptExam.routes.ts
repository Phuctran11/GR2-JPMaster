import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import jlptExamController from "../../controllers/jlpt/jlptExam.controller.js";
import { asyncHandler } from "../../utils/http.js";

const router = Router();

router.get("/", asyncHandler(jlptExamController.listExams));
router.get("/:examId", asyncHandler(jlptExamController.getExam));
router.post("/:examId/submit", authMiddleware, asyncHandler(jlptExamController.submitExam));

export default router;
