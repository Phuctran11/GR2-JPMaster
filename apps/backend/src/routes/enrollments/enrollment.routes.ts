import { Router } from "express";
import enrollmentController from "../../controllers/enrollments/enrollment.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/http.js";

const router = Router();

/**
 * Enrollment Routes
 * Handles course enrollment, access, and enrollment status management
 */

// Get all user's enrolled courses (all statuses)
router.get("/my-courses", authMiddleware, asyncHandler(enrollmentController.getMyCourses));

// Get enrolled courses by status (active, completed, dropped)
router.get("/my-courses/:status", authMiddleware, asyncHandler(enrollmentController.getMyCoursesByStatus));

// Get current user's enrollment status for a course without requiring access
router.get("/course/:courseId/status", authMiddleware, asyncHandler(enrollmentController.getCourseEnrollmentStatus));

// Get specific enrolled course detail (includes lessons + ratings)
router.get("/course/:courseId", authMiddleware, asyncHandler(enrollmentController.getEnrolledCourseDetail));

// Get next unfinished lesson for enrolled course
router.get("/course/:courseId/next-lesson", authMiddleware, asyncHandler(enrollmentController.getNextLessonForCourse));

// Mark lesson as completed
router.put("/course/:courseId/lessons/:lessonId/start", authMiddleware, asyncHandler(enrollmentController.markLessonStarted));

router.put("/course/:courseId/lessons/:lessonId/complete", authMiddleware, asyncHandler(enrollmentController.markLessonCompleted));

// Enroll user in a course
router.post("/enroll", authMiddleware, asyncHandler(enrollmentController.enrollCourse));

// Update enrollment status (active -> completed/dropped)
router.put("/:enrollmentId", authMiddleware, asyncHandler(enrollmentController.updateEnrollmentStatus));

// Drop/delete enrollment
router.delete("/:enrollmentId", authMiddleware, asyncHandler(enrollmentController.dropEnrollment));

export default router;
