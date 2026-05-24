import { Router } from "express";
import goalController from "../controllers/goal.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);
router.get("/me", goalController.listGoals.bind(goalController));
router.get("/me/progress", goalController.listProgress.bind(goalController));
router.post("/", goalController.createGoal.bind(goalController));
router.put("/:id", goalController.updateGoal.bind(goalController));
router.delete("/:id", goalController.deleteGoal.bind(goalController));

export default router;
