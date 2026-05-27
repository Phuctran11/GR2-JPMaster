import paymentModel from "../../models/payments/payment.model.js";
import { ApiError } from "../../utils/http.js";
import payOsService from "./payos.service.js";
import { isPaidPayOsWebhook, type PayOsWebhookPayload } from "./payment.helpers.js";

export class PaymentWebhookService {
  async processPayOsWebhook(body: PayOsWebhookPayload) {
    if (!payOsService.verifyWebhook(body)) {
      throw new ApiError(400, "Invalid payOS webhook signature");
    }

    const data = body.data ?? {};
    const orderCode = Number(data.orderCode);
    const amount = Number(data.amount);

    if (!isPaidPayOsWebhook(body) || !Number.isFinite(orderCode) || !Number.isFinite(amount)) {
      return { processed: false };
    }

    const enrollment = await paymentModel.confirmPayOsWebhook({
      orderCode,
      amount,
      paymentLinkId: typeof data.paymentLinkId === "string" ? data.paymentLinkId : null,
      rawPayload: body as Record<string, unknown>,
    });

    return { processed: Boolean(enrollment) };
  }
}

export default new PaymentWebhookService();
