import { Router } from "express";
import jlptExamController from "../controllers/jlptExam.controller.js";

const router = Router();

router.get("/", jlptExamController.listExams.bind(jlptExamController));
router.get("/:examId", jlptExamController.getExam.bind(jlptExamController));
router.post("/:examId/submit", jlptExamController.submitExam.bind(jlptExamController));

export default router;
