import { NextFunction, Request, Response, Router } from "express";
import multer from "multer";
import adminController from "../controllers/admin.controller.js";
import cloudinaryAssetController from "../controllers/cloudinaryAsset.controller.js";
import adminMiddleware from "../middlewares/admin.middleware.js";

const router = Router();
const MAX_UPLOAD_FILE_SIZE_MB = 200;
const UPLOAD_REQUEST_TIMEOUT_MS = 10 * 60 * 1000;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_FILE_SIZE_MB * 1024 * 1024,
    files: 1,
  },
});

const extendUploadTimeout = (req: Request, res: Response, next: NextFunction) => {
  req.setTimeout(UPLOAD_REQUEST_TIMEOUT_MS);
  res.setTimeout(UPLOAD_REQUEST_TIMEOUT_MS);
  next();
};

router.use(adminMiddleware);

router.get("/stats", adminController.getStats.bind(adminController));
router.post(
  "/assets/upload",
  extendUploadTimeout,
  upload.single("file"),
  cloudinaryAssetController.uploadAsset.bind(cloudinaryAssetController)
);

router.get("/users", adminController.listUsers.bind(adminController));
router.post("/users", adminController.createUser.bind(adminController));
router.put("/users/:id", adminController.updateUser.bind(adminController));
router.delete("/users/:id", adminController.deleteUser.bind(adminController));

router.get("/courses", adminController.listCourses.bind(adminController));
router.post("/courses", adminController.createCourse.bind(adminController));
router.put("/courses/:id", adminController.updateCourse.bind(adminController));
router.delete("/courses/:id", adminController.deleteCourse.bind(adminController));

router.get("/lessons", adminController.listLessons.bind(adminController));
router.post("/lessons", adminController.createLesson.bind(adminController));
router.put("/lessons/:id", adminController.updateLesson.bind(adminController));
router.delete("/lessons/:id", adminController.deleteLesson.bind(adminController));

router.get("/tests", adminController.listQuizzes.bind(adminController));
router.post("/tests", adminController.createQuiz.bind(adminController));
router.put("/tests/:id", adminController.updateQuiz.bind(adminController));
router.delete("/tests/:id", adminController.deleteQuiz.bind(adminController));
router.get("/tests/:id/questions", adminController.listQuizQuestions.bind(adminController));
router.post("/tests/:id/questions", adminController.createQuizQuestion.bind(adminController));
router.put("/tests/:quizId/questions/:questionId", adminController.updateQuizQuestion.bind(adminController));
router.patch("/tests/:quizId/questions/:questionId/order", adminController.updateQuizQuestionOrder.bind(adminController));
router.delete("/tests/:quizId/questions/:questionId", adminController.deleteQuizQuestion.bind(adminController));

router.get("/jlpt-exams", adminController.listJlptExams.bind(adminController));
router.post("/jlpt-exams", adminController.createJlptExam.bind(adminController));
router.put("/jlpt-exams/:examId", adminController.updateJlptExam.bind(adminController));
router.delete("/jlpt-exams/:examId", adminController.deleteJlptExam.bind(adminController));
router.get("/reading-passages", adminController.listReadingPassages.bind(adminController));
router.post("/reading-passages", adminController.createReadingPassage.bind(adminController));
router.put("/reading-passages/:passageId", adminController.updateReadingPassage.bind(adminController));
router.delete("/reading-passages/:passageId", adminController.deleteReadingPassage.bind(adminController));
router.get("/jlpt-exams/:examId/sections", adminController.listJlptSections.bind(adminController));
router.post("/jlpt-exams/:examId/sections", adminController.createJlptSection.bind(adminController));
router.put("/jlpt-sections/:sectionId", adminController.updateJlptSection.bind(adminController));
router.delete("/jlpt-sections/:sectionId", adminController.deleteJlptSection.bind(adminController));
router.get("/jlpt-sections/:sectionId/questions", adminController.listJlptSectionQuestions.bind(adminController));
router.post("/jlpt-sections/:sectionId/questions", adminController.createJlptSectionQuestion.bind(adminController));
router.post("/jlpt-sections/:sectionId/questions/auto", adminController.autoAddJlptSectionQuestions.bind(adminController));
router.put("/jlpt-sections/:sectionId/questions/:questionId", adminController.updateJlptSectionQuestion.bind(adminController));
router.patch("/jlpt-sections/:sectionId/questions/:questionId/order", adminController.updateJlptSectionQuestionOrder.bind(adminController));
router.delete("/jlpt-sections/:sectionId/questions/:questionId", adminController.deleteJlptSectionQuestion.bind(adminController));

router.get("/blogs", adminController.listBlogs.bind(adminController));
router.post("/blogs", adminController.createBlog.bind(adminController));
router.put("/blogs/:id", adminController.updateBlog.bind(adminController));
router.delete("/blogs/:id", adminController.deleteBlog.bind(adminController));

export default router;
