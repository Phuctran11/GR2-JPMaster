import { Router } from "express";
import adminLessonsController from "../../controllers/admin/lessons.controller.js";
import { asyncHandler } from "../../utils/http.js";

const router = Router();

router.get("/", asyncHandler(adminLessonsController.listLessons));
router.post("/", asyncHandler(adminLessonsController.createLesson));
router.put("/:id", asyncHandler(adminLessonsController.updateLesson));
router.delete("/:id", asyncHandler(adminLessonsController.deleteLesson));

export default router;
