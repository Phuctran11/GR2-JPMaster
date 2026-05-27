import enrollmentModel, { type EnrollmentStatus } from "../../models/enrollments/enrollment.model.js";
import quizModel from "../../models/quizzes/quiz.model.js";
import { ApiError } from "../../utils/http.js";

export async function requireCourseAccess(userId: number, courseId: number) {
  const hasAccess = await enrollmentModel.checkUserCourseAccess(userId, courseId);
  if (!hasAccess) {
    throw new ApiError(403, "You are not enrolled in this course");
  }
}

export async function requireOwnedEnrollment(userId: number, enrollmentId: number) {
  const enrollment = await enrollmentModel.getEnrollmentById(enrollmentId);
  if (!enrollment) {
    throw new ApiError(404, "Enrollment not found");
  }

  if (enrollment.user_id !== userId) {
    throw new ApiError(403, "Access denied");
  }

  return enrollment;
}

export async function getEffectiveEnrollmentStatus(
  userId: number,
  courseId: number,
  status: EnrollmentStatus
): Promise<EnrollmentStatus> {
  if (status !== "completed") return status;

  const finalQuizPassed = await quizModel.hasPassedFinalQuiz(userId, courseId);
  return finalQuizPassed ? "completed" : "active";
}
