import { Router } from "express";
import courseController from "../../controllers/courses/course.controller.js";
import { asyncHandler } from "../../utils/http.js";

const router = Router();

router.get("/", asyncHandler(courseController.getAllCourses));
router.get("/popular", asyncHandler(courseController.getPopularCourses));
router.get("/creator/:userId", asyncHandler(courseController.getCoursesByCreator));
router.get("/:id", asyncHandler(courseController.getCourse));

export default router;
