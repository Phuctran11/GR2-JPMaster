import certificateModel from "../../models/certificates/certificate.model.js";
import courseModel from "../../models/courses/course.model.js";
import enrollmentModel from "../../models/enrollments/enrollment.model.js";
import quizModel, { QuizAnswerInput } from "../../models/quizzes/quiz.model.js";
import { ApiError } from "../../utils/http.js";
import learningActivityService from "../achievements/learningActivity.service.js";
import { requireLessonProgressAccess } from "../enrollments/enrollmentAccess.service.js";

export class QuizService {
  private async getQuizCourseIdOrThrow(quizId: number): Promise<number> {
    const quizCourseId = await quizModel.getQuizCourseId(quizId);
    if (!quizCourseId) {
      throw new ApiError(404, "Quiz not found");
    }
    return quizCourseId;
  }

  private async requireCourseAccess(userId: number, courseId: number): Promise<void> {
    const hasAccess = await enrollmentModel.checkUserCourseAccess(userId, courseId);
    if (!hasAccess) {
      throw new ApiError(403, "You are not enrolled in this course");
    }
  }

  private async completeCourseIfFinalQuizPassed(userId: number, courseId: number, quizId: number, passed: boolean): Promise<void> {
    if (!passed) return;

    const quiz = await quizModel.getPublicQuizById(quizId, userId);
    if (quiz?.quiz_type !== "final_test") return;

    const progressSummary = await courseModel.getCourseProgressSummary(userId, courseId);
    const allLessonsCompleted =
      progressSummary.totalLessons > 0 && progressSummary.completedLessons === progressSummary.totalLessons;
    if (!allLessonsCompleted) return;

    const enrollment = await enrollmentModel.updateEnrollmentStatusByUserAndCourse(userId, courseId, "completed");
    if (enrollment) {
      await certificateModel.getOrCreateCertificate(userId, courseId, enrollment.enrollment_id);
    }
  }

  async startQuiz(userId: number, quizId: number) {
    const courseId = await this.getQuizCourseIdOrThrow(quizId);
    await this.requireCourseAccess(userId, courseId);
    const quiz = await quizModel.getPublicQuizById(quizId, userId);
    if (quiz?.quiz_type === "lesson_quiz" && quiz.lesson_id) {
      await requireLessonProgressAccess(userId, courseId, quiz.lesson_id);
    }
    const attempt = await quizModel.startQuizAttempt(userId, quizId);
    if (!attempt) {
      throw new ApiError(404, "Quiz not found");
    }
    return attempt;
  }

  async getLessonQuiz(userId: number, lessonId: number) {
    const courseId = await quizModel.getLessonCourseId(lessonId);
    if (!courseId) {
      throw new ApiError(404, "Lesson not found");
    }
    await this.requireCourseAccess(userId, courseId);
    await requireLessonProgressAccess(userId, courseId, lessonId);
    return quizModel.getLessonQuiz(lessonId, userId);
  }

  async getFinalQuiz(userId: number, courseId: number) {
    await this.requireCourseAccess(userId, courseId);
    return quizModel.getFinalQuiz(courseId, userId);
  }

  async submitQuiz(userId: number, quizId: number, answers: QuizAnswerInput[], attemptId?: number) {
    const courseId = await this.getQuizCourseIdOrThrow(quizId);
    await this.requireCourseAccess(userId, courseId);
    const quiz = await quizModel.getPublicQuizById(quizId, userId);
    if (quiz?.quiz_type === "lesson_quiz" && quiz.lesson_id) {
      await requireLessonProgressAccess(userId, courseId, quiz.lesson_id);
    }

    const result = await quizModel.submitQuiz(userId, quizId, answers, attemptId);
    if (!result) {
      throw new ApiError(404, "Quiz not found");
    }
    await this.completeCourseIfFinalQuizPassed(userId, courseId, quizId, result.passed);
    await learningActivityService.recordQuizSubmitted(userId, quizId, result.score);

    return result;
  }
}

export default new QuizService();
