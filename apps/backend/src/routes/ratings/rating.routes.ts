import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import ratingController from "../../controllers/ratings/rating.controller.js";
import { asyncHandler } from "../../utils/http.js";

const router = Router();

// Public routes
router.get("/courses/:courseId", asyncHandler(ratingController.getCourseRatings));
router.get("/top-rated/courses", asyncHandler(ratingController.getTopRatedCourses));
router.get("/feedback/learner", asyncHandler(ratingController.getLearnerFeedbackTestimonials));

// Protected routes - require authentication
router.post("/courses/:courseId", authMiddleware, asyncHandler(ratingController.createRating));
router.put("/:ratingId", authMiddleware, asyncHandler(ratingController.updateRating));
router.delete("/:ratingId", authMiddleware, asyncHandler(ratingController.deleteRating));

export default router;
