import { Router } from "express";
import paymentController from "../controllers/payment.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/courses/:courseId/payos", authMiddleware, paymentController.createCoursePayOsPayment.bind(paymentController));
router.get("/:transactionId/status", authMiddleware, paymentController.getPaymentStatus.bind(paymentController));
router.post("/:transactionId/confirm", authMiddleware, paymentController.confirmPayment.bind(paymentController));
router.post("/webhooks/payos", paymentController.payOsWebhook.bind(paymentController));

export default router;
