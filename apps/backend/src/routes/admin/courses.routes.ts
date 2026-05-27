import { Router } from "express";
import adminCoursesController from "../../controllers/admin/courses.controller.js";
import { asyncHandler } from "../../utils/http.js";

const router = Router();

router.get("/", asyncHandler(adminCoursesController.listCourses));
router.post("/", asyncHandler(adminCoursesController.createCourse));
router.put("/:id", asyncHandler(adminCoursesController.updateCourse));
router.delete("/:id", asyncHandler(adminCoursesController.deleteCourse));

export default router;
