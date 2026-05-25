import { Router } from "express";
import certificateController from "../../controllers/certificates/certificate.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/http.js";

const router = Router();

router.get("/courses/:courseId", authMiddleware, asyncHandler(certificateController.getCourseCertificate));

export default router;
