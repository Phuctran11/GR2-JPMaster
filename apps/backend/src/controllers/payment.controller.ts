import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import courseModel from "../models/course.model.js";
import enrollmentModel from "../models/enrollment.model.js";
import paymentModel from "../models/payment.model.js";
import purchaseModel from "../models/purchase.model.js";
import payOsService from "../services/payos.service.js";

const buildFrontendUrl = (path: string) => {
  const baseUrl = process.env.FRONTEND_URL?.trim() || "http://localhost:5173";
  return `${baseUrl.replace(/\/$/, "")}${path}`;
};

const buildPayOsRedirectUrl = (envKey: "PAYOS_RETURN_URL" | "PAYOS_CANCEL_URL", courseId: number) => {
  const configuredUrl = process.env[envKey]?.trim();
  const coursePath = `/courses/${courseId}`;

  if (!configuredUrl) return buildFrontendUrl(coursePath);
  if (configuredUrl.includes("{courseId}")) return configuredUrl.replaceAll("{courseId}", String(courseId));

  try {
    const url = new URL(configuredUrl);
    if (url.pathname === "/" || url.pathname === "") {
      url.pathname = coursePath;
      return url.toString();
    }
  } catch {
    return configuredUrl;
  }

  return configuredUrl;
};

export class PaymentController {
  async createCoursePayOsPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const courseId = Number(req.params.courseId);
      if (!Number.isFinite(courseId)) {
        return res.status(400).json({ error: "Invalid course ID" });
      }

      const course = await courseModel.getCourseById(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      const alreadyEnrolled = await enrollmentModel.checkUserCourseAccess(req.user.user_id, courseId);
      if (alreadyEnrolled) {
        return res.status(409).json({ error: "User already enrolled in this course" });
      }

      const amount = Number(course.price);
      if (!Number.isFinite(amount) || amount <= 0) {
        const enrollment = await enrollmentModel.enrollUser(req.user.user_id, courseId, "active");
        const purchase = await purchaseModel.createPurchase(req.user.user_id, courseId, 0, "completed");
        return res.status(201).json({
          message: "Free course enrolled successfully",
          data: { enrollment, purchase, payment_required: false },
        });
      }

      const expiresInMinutes = Number(process.env.PAYOS_PAYMENT_EXPIRE_MINUTES || 30);
      const orderCode = Date.now() + req.user.user_id;
      const description = `JPM${orderCode}`;
      const payOsResponse = await payOsService.createPaymentLink({
        orderCode,
        amount,
        description,
        buyerEmail: req.user.email,
        buyerName: req.user.email,
        returnUrl: buildPayOsRedirectUrl("PAYOS_RETURN_URL", courseId),
        cancelUrl: buildPayOsRedirectUrl("PAYOS_CANCEL_URL", courseId),
        items: [{ name: course.title, quantity: 1, price: Math.round(amount) }],
      });

      const created = await paymentModel.createPayOsTransaction({
        userId: req.user.user_id,
        courseId,
        amount,
        orderCode,
        paymentContent: description,
        checkoutUrl: payOsResponse.data?.checkoutUrl || "",
        qrCode: payOsResponse.data?.qrCode || null,
        paymentLinkId: payOsResponse.data?.paymentLinkId || null,
        rawResponse: payOsResponse as unknown as Record<string, unknown>,
        expiresInMinutes: Number.isFinite(expiresInMinutes) ? expiresInMinutes : 30,
      });

      return res.status(201).json({
        message: "payOS payment created",
        data: {
          payment_required: true,
          purchase: created.purchase,
          transaction: created.transaction,
          course: {
            course_id: course.course_id,
            title: course.title,
            price: amount,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const transactionId = Number(req.params.transactionId);
      if (!Number.isFinite(transactionId)) {
        return res.status(400).json({ error: "Invalid payment transaction ID" });
      }

      await paymentModel.markExpiredTransactions();
      const transaction = await paymentModel.getTransactionWithPurchase(transactionId);
      if (!transaction) {
        return res.status(404).json({ error: "Payment transaction not found" });
      }

      if (transaction.user_id !== req.user.user_id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      return res.status(200).json({
        data: {
          payment_transaction_id: transaction.payment_transaction_id,
          purchase_id: transaction.purchase_id,
          course_id: transaction.course_id,
          amount: Number(transaction.amount),
          currency: transaction.currency,
          payment_content: transaction.payment_content,
          qr_image_url: transaction.qr_image_url,
          checkout_url: transaction.checkout_url,
          status: transaction.status,
          purchase_status: transaction.purchase_status,
          paid_at: transaction.paid_at,
          expired_at: transaction.expired_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async confirmPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const transactionId = Number(req.params.transactionId);
      if (!Number.isFinite(transactionId)) {
        return res.status(400).json({ error: "Invalid payment transaction ID" });
      }

      const enrollment = await paymentModel.confirmPaid(transactionId, req.user.user_id);
      if (!enrollment) {
        return res.status(404).json({ error: "Payment transaction not found" });
      }

      return res.status(200).json({
        message: "Payment confirmed and course enrollment activated",
        data: { enrollment },
      });
    } catch (error) {
      next(error);
    }
  }

  async payOsWebhook(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!payOsService.verifyWebhook(req.body)) {
        return res.status(400).json({ error: "Invalid payOS webhook signature" });
      }

      const data = req.body.data;
      const orderCode = Number(data.orderCode);
      const amount = Number(data.amount);
      const code = String(data.code || req.body.code || "");
      const status = String(data.status || "");
      const isPaid = code === "00" || status === "PAID";

      if (!isPaid || !Number.isFinite(orderCode) || !Number.isFinite(amount)) {
        return res.status(200).json({ success: true, processed: false });
      }

      const enrollment = await paymentModel.confirmPayOsWebhook({
        orderCode,
        amount,
        paymentLinkId: data.paymentLinkId || null,
        rawPayload: req.body,
      });

      return res.status(200).json({ success: true, processed: Boolean(enrollment) });
    } catch (error) {
      next(error);
    }
  }
}

export default new PaymentController();
