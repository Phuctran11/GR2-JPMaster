import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import certificateModel from "../models/certificate.model.js";
import enrollmentModel from "../models/enrollment.model.js";
import quizModel from "../models/quiz.model.js";

export class CertificateController {
  async getCourseCertificate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { courseId } = req.params;
      if (!courseId || isNaN(Number(courseId))) {
        return res.status(400).json({ error: "Invalid course ID" });
      }

      const numericCourseId = Number(courseId);
      const enrollment = await enrollmentModel.getEnrollmentByUserAndCourse(req.user.user_id, numericCourseId);
      if (!enrollment || !["active", "completed"].includes(enrollment.status)) {
        return res.status(403).json({ error: "You are not enrolled in this course" });
      }

      const finalQuizPassed = await quizModel.hasPassedFinalQuiz(req.user.user_id, numericCourseId);
      if (enrollment.status !== "completed" || !finalQuizPassed) {
        return res.status(403).json({ error: "Complete every lesson and pass the final test before downloading your certificate" });
      }

      const certificate = await certificateModel.getOrCreateCertificate(
        req.user.user_id,
        numericCourseId,
        enrollment.enrollment_id
      );

      return res.status(200).json({ data: certificate });
    } catch (error) {
      next(error);
    }
  }
}

export default new CertificateController();
