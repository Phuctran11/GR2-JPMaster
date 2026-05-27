import certificateModel from "../../models/certificates/certificate.model.js";
import enrollmentModel from "../../models/enrollments/enrollment.model.js";
import quizModel from "../../models/quizzes/quiz.model.js";
import { ApiError } from "../../utils/http.js";

export class CertificateService {
  async getCourseCertificate(userId: number, courseId: number) {
    const enrollment = await enrollmentModel.getEnrollmentByUserAndCourse(userId, courseId);
    if (!enrollment || !["active", "completed"].includes(enrollment.status)) {
      throw new ApiError(403, "You are not enrolled in this course");
    }

    const finalQuizPassed = await quizModel.hasPassedFinalQuiz(userId, courseId);
    if (enrollment.status !== "completed" || !finalQuizPassed) {
      throw new ApiError(403, "Complete every lesson and pass the final test before downloading your certificate");
    }

    return certificateModel.getOrCreateCertificate(userId, courseId, enrollment.enrollment_id);
  }
}

export default new CertificateService();
