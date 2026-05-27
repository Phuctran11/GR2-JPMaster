import { Router } from "express";
import paymentController from "../../controllers/payments/payment.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/http.js";

const router = Router();

router.post("/courses/:courseId/payos", authMiddleware, asyncHandler(paymentController.createCoursePayOsPayment));
router.get("/:transactionId/status", authMiddleware, asyncHandler(paymentController.getPaymentStatus));
router.post("/:transactionId/confirm", authMiddleware, asyncHandler(paymentController.confirmPayment));
router.post("/webhooks/payos", asyncHandler(paymentController.payOsWebhook));

export default router;
