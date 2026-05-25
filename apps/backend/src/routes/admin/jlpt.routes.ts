import { Router } from "express";
import adminJlptController from "../../controllers/admin/jlpt.controller.js";
import { asyncHandler } from "../../utils/http.js";

const router = Router();

router.get("/jlpt-exams", asyncHandler(adminJlptController.listJlptExams));
router.post("/jlpt-exams", asyncHandler(adminJlptController.createJlptExam));
router.put("/jlpt-exams/:examId", asyncHandler(adminJlptController.updateJlptExam));
router.delete("/jlpt-exams/:examId", asyncHandler(adminJlptController.deleteJlptExam));

router.get("/reading-passages", asyncHandler(adminJlptController.listReadingPassages));
router.post("/reading-passages", asyncHandler(adminJlptController.createReadingPassage));
router.put("/reading-passages/:passageId", asyncHandler(adminJlptController.updateReadingPassage));
router.delete("/reading-passages/:passageId", asyncHandler(adminJlptController.deleteReadingPassage));

router.get("/jlpt-exams/:examId/sections", asyncHandler(adminJlptController.listJlptSections));
router.post("/jlpt-exams/:examId/sections", asyncHandler(adminJlptController.createJlptSection));
router.put("/jlpt-sections/:sectionId", asyncHandler(adminJlptController.updateJlptSection));
router.delete("/jlpt-sections/:sectionId", asyncHandler(adminJlptController.deleteJlptSection));
router.get("/jlpt-sections/:sectionId/questions", asyncHandler(adminJlptController.listJlptSectionQuestions));
router.post("/jlpt-sections/:sectionId/questions", asyncHandler(adminJlptController.createJlptSectionQuestion));
router.post("/jlpt-sections/:sectionId/questions/auto", asyncHandler(adminJlptController.autoAddJlptSectionQuestions));
router.put("/jlpt-sections/:sectionId/questions/:questionId", asyncHandler(adminJlptController.updateJlptSectionQuestion));
router.patch("/jlpt-sections/:sectionId/questions/:questionId/order", asyncHandler(adminJlptController.updateJlptSectionQuestionOrder));
router.delete("/jlpt-sections/:sectionId/questions/:questionId", asyncHandler(adminJlptController.deleteJlptSectionQuestion));

export default router;
