import courseModel, { type CourseWithLessons } from "../../models/courses/course.model.js";
import enrollmentModel, { type CourseEnrollment } from "../../models/enrollments/enrollment.model.js";

export interface EnrichedEnrollment extends CourseEnrollment {
  course: CourseWithLessons | null;
  progress_percent: number;
  completed_lessons: number;
  total_lessons: number;
}

export async function enrichEnrollments(
  userId: number,
  enrollments: CourseEnrollment[]
): Promise<EnrichedEnrollment[]> {
  const courseIds = enrollments.map((enrollment) => enrollment.course_id);
  const [coursesById, progressByCourseId, effectiveStatusByCourseId] = await Promise.all([
    courseModel.getCoursesWithLessonsByIds(courseIds),
    courseModel.getCourseProgressSummaries(userId, courseIds),
    enrollmentModel.getEffectiveStatusesByCourseIds(userId, courseIds),
  ]);

  return enrollments.map((enrollment) => {
    const progressSummary = progressByCourseId.get(enrollment.course_id) ?? {
      totalLessons: 0,
      completedLessons: 0,
      progressPercent: 0,
    };
    const effectiveStatus = effectiveStatusByCourseId.get(enrollment.course_id) ?? enrollment.status;
    const progressPercent =
      progressSummary.progressPercent >= 100 && effectiveStatus !== "completed"
        ? 99.99
        : progressSummary.progressPercent;

    return {
      ...enrollment,
      status: effectiveStatus,
      course: coursesById.get(enrollment.course_id) ?? null,
      progress_percent: progressPercent,
      completed_lessons: progressSummary.completedLessons,
      total_lessons: progressSummary.totalLessons,
    };
  });
}
