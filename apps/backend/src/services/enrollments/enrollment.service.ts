import courseModel from "../../models/courses/course.model.js";
import enrollmentModel, {
  ENROLLMENT_STATUSES,
  type EnrollmentStatus,
} from "../../models/enrollments/enrollment.model.js";
import { ApiError } from "../../utils/http.js";
import {
  getEffectiveEnrollmentStatus,
  requireCourseAccess,
  requireLessonProgressAccess,
  requireOwnedEnrollment,
} from "./enrollmentAccess.service.js";
import enrollmentCompletionService from "./enrollmentCompletion.service.js";
import { enrichEnrollments, type EnrichedEnrollment } from "./enrollmentEnrichment.service.js";

export type { EnrichedEnrollment };

export class EnrollmentService {
  parseStatus(status: unknown): EnrollmentStatus {
    if (typeof status !== "string" || !ENROLLMENT_STATUSES.includes(status as EnrollmentStatus)) {
      throw new ApiError(400, `Invalid status. Must be one of: ${ENROLLMENT_STATUSES.join(", ")}`);
    }
    return status as EnrollmentStatus;
  }

  async getEffectiveEnrollmentStatus(
    userId: number,
    courseId: number,
    status: EnrollmentStatus
  ): Promise<EnrollmentStatus> {
    return getEffectiveEnrollmentStatus(userId, courseId, status);
  }

  async getMyCourses(userId: number, limit: number, offset: number) {
    const enrollments = await enrollmentModel.getEnrolledCourses(userId, limit, offset);
    const data = await enrichEnrollments(userId, enrollments);
    return { data };
  }

  async getMyCoursesByStatus(userId: number, status: EnrollmentStatus, limit: number, offset: number) {
    const [enrollments, totalCount] = await Promise.all([
      enrollmentModel.getEnrolledCoursesByEffectiveStatus(userId, status, limit, offset),
      enrollmentModel.getEnrolledCourseCountByEffectiveStatus(userId, status),
    ]);
    const data = await enrichEnrollments(userId, enrollments);
    return { data, totalCount };
  }

  async enrichEnrollments(userId: number, enrollments: Parameters<typeof enrichEnrollments>[1]): Promise<EnrichedEnrollment[]> {
    return enrichEnrollments(userId, enrollments);
  }

  async enrollCourse(userId: number, courseId: number, pricePaid = 0) {
    const course = await courseModel.getCourseById(courseId);
    if (!course) {
      throw new ApiError(404, "Course not found");
    }

    const alreadyEnrolled = await enrollmentModel.checkUserCourseAccess(userId, courseId);
    if (alreadyEnrolled) {
      throw new ApiError(409, "User already enrolled in this course");
    }

    if (Number(course.price) > 0) {
      return { paymentRequired: true as const };
    }

    const { enrollment, purchase } = await enrollmentModel.enrollUserWithCompletedPurchase(userId, courseId, pricePaid || 0);

    return { paymentRequired: false as const, enrollment, purchase };
  }

  async updateEnrollmentStatus(userId: number, enrollmentId: number, status: EnrollmentStatus) {
    await requireOwnedEnrollment(userId, enrollmentId);

    const updated = await enrollmentModel.updateEnrollmentStatus(enrollmentId, status);
    if (!updated) {
      throw new ApiError(500, "Failed to update enrollment");
    }

    return updated;
  }

  async getCourseEnrollmentStatus(userId: number, courseId: number) {
    const course = await courseModel.getCourseById(courseId);
    if (!course) {
      throw new ApiError(404, "Course not found");
    }

    const enrollment = await enrollmentModel.getEnrollmentByUserAndCourse(userId, courseId);
    if (!enrollment) {
      return {
        enrolled: false,
        enrollment_status: null,
        enrollment_date: null,
      };
    }

    const effectiveStatus = await this.getEffectiveEnrollmentStatus(userId, courseId, enrollment.status);
    return {
      enrolled: effectiveStatus === "active" || effectiveStatus === "completed",
      enrollment_status: effectiveStatus,
      enrollment_date: enrollment.enrollment_date,
    };
  }

  async getEnrolledCourseDetail(userId: number, courseId: number) {
    await requireCourseAccess(userId, courseId);

    const courseDetail = await courseModel.getCourseByIdWithDetail(courseId);
    if (!courseDetail) {
      throw new ApiError(404, "Course not found");
    }

    const lessonCompletionMap = await courseModel.getLessonCompletionMap(userId, courseId);
    const lessonsWithProgress = courseDetail.lessons?.map((lesson) => ({
      ...lesson,
      is_completed: lessonCompletionMap.get(lesson.lesson_id) || false,
    })) ?? [];
    const firstUnfinishedLessonIndex = lessonsWithProgress.findIndex((lesson) => !lesson.is_completed);

    courseDetail.lessons = lessonsWithProgress.map((lesson, index) => {
      const isAccessible = lesson.is_completed || firstUnfinishedLessonIndex === -1 || index === firstUnfinishedLessonIndex;

      if (isAccessible) {
        return {
          ...lesson,
          is_accessible: true,
          is_locked: false,
        };
      }

      return {
        ...lesson,
        content_text: null,
        video_url: null,
        video_asset_id: null,
        audio_url: null,
        audio_asset_id: null,
        is_accessible: false,
        is_locked: true,
      };
    });

    const enrollment = await enrollmentModel.getEnrollmentByUserAndCourse(userId, courseId);
    const effectiveStatus = enrollment
      ? await this.getEffectiveEnrollmentStatus(userId, courseId, enrollment.status)
      : "active";

    return {
      ...courseDetail,
      enrollment_status: effectiveStatus,
      enrollment_date: enrollment?.enrollment_date,
    };
  }

  async getFirstLessonByCourse(userId: number, courseId: number) {
    await requireCourseAccess(userId, courseId);

    const lesson = await courseModel.getFirstLessonByCourseId(courseId);
    if (!lesson) {
      throw new ApiError(404, "No lessons found for this course");
    }

    return lesson;
  }

  async getNextLessonForCourse(userId: number, courseId: number) {
    await requireCourseAccess(userId, courseId);

    const lesson = await courseModel.getNextUnfinishedLessonByUserAndCourse(userId, courseId);
    if (!lesson) {
      throw new ApiError(404, "No unfinished lessons found for this course");
    }

    return lesson;
  }

  async markLessonStarted(userId: number, courseId: number, lessonId: number) {
    await requireCourseAccess(userId, courseId);
    await requireLessonProgressAccess(userId, courseId, lessonId);

    const updated = await enrollmentModel.markLessonStarted(userId, courseId, lessonId);
    if (!updated) {
      throw new ApiError(404, "Lesson not found");
    }

    return {
      lesson_id: lessonId,
      started: true,
    };
  }

  async markLessonCompleted(userId: number, courseId: number, lessonId: number) {
    await requireLessonProgressAccess(userId, courseId, lessonId);
    return enrollmentCompletionService.markLessonCompleted(userId, courseId, lessonId);
  }

  async dropEnrollment(userId: number, enrollmentId: number) {
    await requireOwnedEnrollment(userId, enrollmentId);

    const deleted = await enrollmentModel.deleteEnrollment(enrollmentId);
    if (!deleted) {
      throw new ApiError(500, "Failed to drop enrollment");
    }
  }

}

export default new EnrollmentService();
