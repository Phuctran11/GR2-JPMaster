import { Router } from "express";
import enrollmentController from "../controllers/enrollment.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * Enrollment Routes
 * Handles course enrollment, access, and enrollment status management
 */

// Get all user's enrolled courses (all statuses)
router.get("/my-courses", authMiddleware, (req, res, next) =>
  enrollmentController.getMyCourses(req, res, next)
);

// Get enrolled courses by status (active, completed, dropped)
router.get("/my-courses/:status", authMiddleware, (req, res, next) =>
  enrollmentController.getMyCoursesByStatus(req, res, next)
);

// Get specific enrolled course detail (includes lessons + ratings)
router.get("/course/:courseId", authMiddleware, (req, res, next) =>
  enrollmentController.getEnrolledCourseDetail(req, res, next)
);

// Get next unfinished lesson for enrolled course
router.get("/course/:courseId/next-lesson", authMiddleware, (req, res, next) =>
  enrollmentController.getNextLessonForCourse(req, res, next)
);

// Mark lesson as completed
router.put("/course/:courseId/lessons/:lessonId/start", authMiddleware, (req, res, next) =>
  enrollmentController.markLessonStarted(req, res, next)
);

router.put("/course/:courseId/lessons/:lessonId/complete", authMiddleware, (req, res, next) =>
  enrollmentController.markLessonCompleted(req, res, next)
);

// Enroll user in a course
router.post("/enroll", authMiddleware, (req, res, next) =>
  enrollmentController.enrollCourse(req, res, next)
);

// Update enrollment status (active -> completed/dropped)
router.put("/:enrollmentId", authMiddleware, (req, res, next) =>
  enrollmentController.updateEnrollmentStatus(req, res, next)
);

// Drop/delete enrollment
router.delete("/:enrollmentId", authMiddleware, (req, res, next) =>
  enrollmentController.dropEnrollment(req, res, next)
);

export default router;
