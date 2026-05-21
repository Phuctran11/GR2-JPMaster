import { Router } from "express";
import certificateController from "../controllers/certificate.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/courses/:courseId", authMiddleware, (req, res, next) =>
  certificateController.getCourseCertificate(req, res, next)
);

export default router;
