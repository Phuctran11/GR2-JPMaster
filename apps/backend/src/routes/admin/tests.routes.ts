import { Router } from "express";
import adminTestsController from "../../controllers/admin/tests.controller.js";
import { asyncHandler } from "../../utils/http.js";

const router = Router();

router.get("/", asyncHandler(adminTestsController.listQuizzes));
router.post("/", asyncHandler(adminTestsController.createQuiz));
router.put("/:id", asyncHandler(adminTestsController.updateQuiz));
router.delete("/:id", asyncHandler(adminTestsController.deleteQuiz));
router.get("/:id/questions", asyncHandler(adminTestsController.listQuizQuestions));
router.post("/:id/questions", asyncHandler(adminTestsController.createQuizQuestion));
router.put("/:quizId/questions/:questionId", asyncHandler(adminTestsController.updateQuizQuestion));
router.patch("/:quizId/questions/:questionId/order", asyncHandler(adminTestsController.updateQuizQuestionOrder));
router.delete("/:quizId/questions/:questionId", asyncHandler(adminTestsController.deleteQuizQuestion));

export default router;
