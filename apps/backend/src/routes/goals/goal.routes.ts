import { Router } from "express";
import goalController from "../../controllers/goals/goal.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/http.js";

const router = Router();

router.use(authMiddleware);
router.get("/me", asyncHandler(goalController.listGoals));
router.get("/me/progress", asyncHandler(goalController.listProgress));
router.post("/", asyncHandler(goalController.createGoal));
router.put("/:id", asyncHandler(goalController.updateGoal));
router.delete("/:id", asyncHandler(goalController.deleteGoal));

export default router;
