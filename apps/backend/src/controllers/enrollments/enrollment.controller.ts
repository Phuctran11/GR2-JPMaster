import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import enrollmentService from "../../services/enrollments/enrollment.service.js";
import { ok, paginated, requireUser } from "../../utils/http.js";
import { parsePagination, parsePositiveInt } from "../../validators/common.validator.js";

export class EnrollmentController {
  async getMyCourses(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);
    const { limit, offset } = parsePagination(req.query, { defaultLimit: 10 });
    const { data } = await enrollmentService.getMyCourses(user.user_id, limit, offset);
    return paginated(res, data);
  }

  async getMyCoursesByStatus(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);
    const status = enrollmentService.parseStatus(req.params.status);
    const { limit, offset } = parsePagination(req.query, { defaultLimit: 10 });
    const { data, totalCount } = await enrollmentService.getMyCoursesByStatus(user.user_id, status, limit, offset);
    return paginated(res, data, totalCount);
  }

  async enrollCourse(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);
    const courseId = parsePositiveInt(req.body.course_id, "course ID");
    const pricePaid = Number(req.body.price_paid) || 0;
    const result = await enrollmentService.enrollCourse(user.user_id, courseId, pricePaid);

    if (result.paymentRequired) {
      return res.status(402).json({
        message: "Payment required",
        payment_required: true,
      });
    }

    return res.status(201).json({
      message: "Enrollment created successfully",
      data: result.enrollment,
      purchase: result.purchase,
      payment_required: false,
    });
  }

  async updateEnrollmentStatus(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);
    const enrollmentId = parsePositiveInt(req.params.enrollmentId, "enrollment ID");
    const status = enrollmentService.parseStatus(req.body.status);
    const updated = await enrollmentService.updateEnrollmentStatus(user.user_id, enrollmentId, status);
    return ok(res, updated, { message: "Enrollment updated successfully" });
  }

  async getEnrolledCourseDetail(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);
    const courseId = parsePositiveInt(req.params.courseId, "course ID");
    const course = await enrollmentService.getEnrolledCourseDetail(user.user_id, courseId);
    return ok(res, course);
  }

  async getFirstLessonByCourse(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);
    const courseId = parsePositiveInt(req.params.courseId, "course ID");
    const lesson = await enrollmentService.getFirstLessonByCourse(user.user_id, courseId);
    return ok(res, lesson);
  }

  async getNextLessonForCourse(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);
    const courseId = parsePositiveInt(req.params.courseId, "course ID");
    const lesson = await enrollmentService.getNextLessonForCourse(user.user_id, courseId);
    return ok(res, lesson);
  }

  async markLessonStarted(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);
    const courseId = parsePositiveInt(req.params.courseId, "course ID");
    const lessonId = parsePositiveInt(req.params.lessonId, "lesson ID");
    const result = await enrollmentService.markLessonStarted(user.user_id, courseId, lessonId);
    return ok(res, result, { message: "Lesson started successfully" });
  }

  async markLessonCompleted(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);
    const courseId = parsePositiveInt(req.params.courseId, "course ID");
    const lessonId = parsePositiveInt(req.params.lessonId, "lesson ID");
    const result = await enrollmentService.markLessonCompleted(user.user_id, courseId, lessonId);

    if (result.needsLessonQuiz) {
      return res.status(409).json({
        message: "Lesson quiz must be passed before completing this lesson",
        needs_lesson_quiz: true,
        quiz: result.quiz,
      });
    }

    return ok(res, result.data, { message: "Lesson completed successfully" });
  }

  async dropEnrollment(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);
    const enrollmentId = parsePositiveInt(req.params.enrollmentId, "enrollment ID");
    await enrollmentService.dropEnrollment(user.user_id, enrollmentId);
    return res.status(200).json({ message: "Enrollment dropped successfully" });
  }
}

export default new EnrollmentController();

