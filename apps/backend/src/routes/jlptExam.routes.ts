import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import jlptExamController from "../controllers/jlptExam.controller.js";

const router = Router();

router.get("/", jlptExamController.listExams.bind(jlptExamController));
router.get("/:examId", jlptExamController.getExam.bind(jlptExamController));
router.post("/:examId/submit", authMiddleware, jlptExamController.submitExam.bind(jlptExamController));

export default router;
