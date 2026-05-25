import { Router } from "express";
import userController from "../../controllers/users/user.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/http.js";

const router = Router();

router.post("/google-login", asyncHandler(userController.googleLogin));
router.post("/login", asyncHandler(userController.login));
router.get("/me", authMiddleware, asyncHandler(userController.getMe));
router.put("/me", authMiddleware, asyncHandler(userController.updateMe));
router.post("/", asyncHandler(userController.createUser));

export default router;
