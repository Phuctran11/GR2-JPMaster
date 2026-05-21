import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import quizModel from "../models/quiz.model.js";
import enrollmentModel from "../models/enrollment.model.js";
import courseModel from "../models/course.model.js";
import certificateModel from "../models/certificate.model.js";

export class QuizController {
  async startQuiz(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { quizId } = req.params;
      if (!quizId || isNaN(Number(quizId))) {
        return res.status(400).json({ error: "Invalid quiz ID" });
      }

      const quizCourseId = await quizModel.getQuizCourseId(Number(quizId));
      if (!quizCourseId) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      const hasAccess = await enrollmentModel.checkUserCourseAccess(req.user.user_id, quizCourseId);
      if (!hasAccess) {
        return res.status(403).json({ error: "You are not enrolled in this course" });
      }

      const attempt = await quizModel.startQuizAttempt(req.user.user_id, Number(quizId));
      return res.status(201).json({ data: attempt });
    } catch (error) {
      if (error instanceof Error && error.message === "Quiz not found") {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }

  async getLessonQuiz(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { lessonId } = req.params;
      if (!lessonId || isNaN(Number(lessonId))) {
        return res.status(400).json({ error: "Invalid lesson ID" });
      }

      const quiz = await quizModel.getLessonQuiz(Number(lessonId), req.user.user_id);
      return res.status(200).json({ data: quiz });
    } catch (error) {
      next(error);
    }
  }

  async getFinalQuiz(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { courseId } = req.params;
      if (!courseId || isNaN(Number(courseId))) {
        return res.status(400).json({ error: "Invalid course ID" });
      }

      const hasAccess = await enrollmentModel.checkUserCourseAccess(req.user.user_id, Number(courseId));
      if (!hasAccess) {
        return res.status(403).json({ error: "You are not enrolled in this course" });
      }

      const quiz = await quizModel.getFinalQuiz(Number(courseId), req.user.user_id);
      return res.status(200).json({ data: quiz });
    } catch (error) {
      next(error);
    }
  }

  async submitQuiz(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { quizId } = req.params;
      const { answers = [], attempt_id } = req.body;

      if (!quizId || isNaN(Number(quizId))) {
        return res.status(400).json({ error: "Invalid quiz ID" });
      }

      if (!Array.isArray(answers)) {
        return res.status(400).json({ error: "answers must be an array" });
      }

      const quizCourseId = await quizModel.getQuizCourseId(Number(quizId));
      if (!quizCourseId) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      const hasAccess = await enrollmentModel.checkUserCourseAccess(req.user.user_id, quizCourseId);
      if (!hasAccess) {
        return res.status(403).json({ error: "You are not enrolled in this course" });
      }

      const result = await quizModel.submitQuiz(
        req.user.user_id,
        Number(quizId),
        answers,
        attempt_id && !isNaN(Number(attempt_id)) ? Number(attempt_id) : undefined
      );
      const quiz = await quizModel.getPublicQuizById(Number(quizId), req.user.user_id);

      if (result.passed && quiz?.quiz_type === "final_test") {
        const progressSummary = await courseModel.getCourseProgressSummary(req.user.user_id, quizCourseId);
        const allLessonsCompleted = progressSummary.totalLessons > 0 && progressSummary.completedLessons === progressSummary.totalLessons;
        if (allLessonsCompleted) {
          const enrollment = await enrollmentModel.updateEnrollmentStatusByUserAndCourse(req.user.user_id, quizCourseId, "completed");
          if (enrollment) {
            await certificateModel.getOrCreateCertificate(req.user.user_id, quizCourseId, enrollment.enrollment_id);
          }
        }
      }

      return res.status(201).json({
        message: result.passed ? "Quiz passed" : "Quiz submitted",
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Quiz not found") {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }
}

export default new QuizController();
