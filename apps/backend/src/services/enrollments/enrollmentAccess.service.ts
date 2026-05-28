import courseModel from "../../models/courses/course.model.js";
import enrollmentModel, { type EnrollmentStatus } from "../../models/enrollments/enrollment.model.js";
import quizModel from "../../models/quizzes/quiz.model.js";
import { ApiError } from "../../utils/http.js";

export async function requireCourseAccess(userId: number, courseId: number) {
  const hasAccess = await enrollmentModel.checkUserCourseAccess(userId, courseId);
  if (!hasAccess) {
    throw new ApiError(403, "You are not enrolled in this course");
  }
}

export async function requireLessonProgressAccess(userId: number, courseId: number, lessonId: number) {
  const courseDetail = await courseModel.getCourseByIdWithDetail(courseId);
  if (!courseDetail) {
    throw new ApiError(404, "Course not found");
  }

  const lessons = courseDetail.lessons ?? [];
  const lessonIndex = lessons.findIndex((lesson) => lesson.lesson_id === lessonId);
  if (lessonIndex < 0) {
    throw new ApiError(404, "Lesson not found");
  }

  const lessonCompletionMap = await courseModel.getLessonCompletionMap(userId, courseId);
  const firstUnfinishedLessonIndex = lessons.findIndex((lesson) => !lessonCompletionMap.get(lesson.lesson_id));
  const isAccessible =
    Boolean(lessonCompletionMap.get(lessonId)) ||
    firstUnfinishedLessonIndex === -1 ||
    lessonIndex === firstUnfinishedLessonIndex;

  if (!isAccessible) {
    throw new ApiError(403, "Complete previous lessons before opening this lesson");
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
