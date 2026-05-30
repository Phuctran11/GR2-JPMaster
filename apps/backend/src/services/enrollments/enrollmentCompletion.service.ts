import courseModel from "../../models/courses/course.model.js";
import enrollmentModel from "../../models/enrollments/enrollment.model.js";
import quizModel from "../../models/quizzes/quiz.model.js";
import { ApiError } from "../../utils/http.js";
import { requireCourseAccess } from "./enrollmentAccess.service.js";
import learningActivityService from "../learning-activity/learningActivity.service.js";

type LessonCompletionContext = {
  lesson: NonNullable<Awaited<ReturnType<typeof courseModel.getLessonByCourseAndLessonId>>>;
  lessonQuiz: Awaited<ReturnType<typeof quizModel.getLessonQuiz>>;
  lessonQuizPassed: boolean;
};

class EnrollmentCompletionService {
  private async getLessonCompletionContext(
    userId: number,
    courseId: number,
    lessonId: number
  ): Promise<LessonCompletionContext> {
    const lesson = await courseModel.getLessonByCourseAndLessonId(courseId, lessonId);
    if (!lesson) {
      throw new ApiError(404, "Lesson not found");
    }

    const [lessonQuiz, lessonQuizPassed] = await Promise.all([
      quizModel.getLessonQuiz(lessonId, userId),
      quizModel.hasPassedLessonQuiz(userId, lessonId),
    ]);

    return { lesson, lessonQuiz, lessonQuizPassed };
  }

  private async getCourseCompletionState(userId: number, courseId: number) {
    const progressSummary = await courseModel.getCourseProgressSummary(userId, courseId);
    const courseCompleted = progressSummary.totalLessons > 0 && progressSummary.completedLessons === progressSummary.totalLessons;
    const [finalQuiz, finalQuizPassed] = await Promise.all([
      quizModel.getFinalQuiz(courseId, userId),
      quizModel.hasPassedFinalQuiz(userId, courseId),
    ]);

    return {
      progressSummary,
      courseCompleted,
      finalQuiz,
      finalQuizPassed,
    };
  }

  private async completeEnrollmentIfEligible(userId: number, courseId: number, courseCompleted: boolean, finalQuizPassed: boolean) {
    if (courseCompleted && finalQuizPassed) {
      await enrollmentModel.updateEnrollmentStatusByUserAndCourse(userId, courseId, "completed");
    }
  }

  async markLessonCompleted(userId: number, courseId: number, lessonId: number) {
    await requireCourseAccess(userId, courseId);

    const { lesson, lessonQuiz, lessonQuizPassed } = await this.getLessonCompletionContext(userId, courseId, lessonId);
    if (lessonQuiz && !lessonQuizPassed) {
      return {
        needsLessonQuiz: true as const,
        quiz: lessonQuiz,
      };
    }

    const updated = await enrollmentModel.markLessonCompleted(userId, lessonId);
    if (!updated) {
      throw new ApiError(500, "Failed to mark lesson as completed");
    }

    const { progressSummary, courseCompleted, finalQuiz, finalQuizPassed } =
      await this.getCourseCompletionState(userId, courseId);
    await this.completeEnrollmentIfEligible(userId, courseId, courseCompleted, finalQuizPassed);

    const lessonDurationSeconds = lesson.duration ? lesson.duration * 60 : undefined;
    await learningActivityService.recordLessonCompleted(userId, courseId, lessonId, lessonDurationSeconds);

    return {
      needsLessonQuiz: false as const,
      data: {
        lesson_id: lesson.lesson_id,
        completed: updated,
        course_completed: courseCompleted && finalQuizPassed,
        needs_final_quiz: courseCompleted && Boolean(finalQuiz) && !finalQuizPassed,
        final_quiz: courseCompleted && finalQuiz && !finalQuizPassed ? finalQuiz : null,
        enrollment_status: courseCompleted && finalQuizPassed ? "completed" : "active",
        progress_percent: progressSummary.progressPercent,
        completed_lessons: progressSummary.completedLessons,
        total_lessons: progressSummary.totalLessons,
      },
    };
  }
}

export default new EnrollmentCompletionService();
