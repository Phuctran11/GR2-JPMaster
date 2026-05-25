import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import paymentService from "../../services/payments/payment.service.js";
import { created, ok, requireUser } from "../../utils/http.js";
import { parsePositiveInt } from "../../validators/common.validator.js";

export class PaymentController {
  async createCoursePayOsPayment(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);

    const courseId = parsePositiveInt(req.params.courseId, "course ID");
    const result = await paymentService.createCoursePayOsPayment(user, courseId);
    return created(res, result.message, result.data);
  }

  async getPaymentStatus(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);

    const transactionId = parsePositiveInt(req.params.transactionId, "payment transaction ID");
    const paymentStatus = await paymentService.getPaymentStatus(user, transactionId);
    return ok(res, paymentStatus);
  }

  async confirmPayment(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);

    const transactionId = parsePositiveInt(req.params.transactionId, "payment transaction ID");
    const enrollment = await paymentService.confirmPayment(user, transactionId);

    return ok(res, { enrollment }, { message: "Payment confirmed and course enrollment activated" });
  }

  async payOsWebhook(req: AuthenticatedRequest, res: Response) {
    const result = await paymentService.processPayOsWebhook(req.body);
    return res.status(200).json({ success: true, processed: result.processed });
  }
}

export default new PaymentController();
