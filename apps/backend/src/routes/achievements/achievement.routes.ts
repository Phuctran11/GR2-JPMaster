import { Router } from "express";
import achievementController from "../../controllers/achievements/achievement.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/http.js";

const router = Router();

router.use(authMiddleware);
router.get("/me", asyncHandler(achievementController.listMine));

export default router;
