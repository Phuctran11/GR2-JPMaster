import paymentModel from "../../models/payments/payment.model.js";
import { ApiError } from "../../utils/http.js";
import type { AuthUser } from "./payment.helpers.js";

export class PaymentStatusService {
  async getPaymentStatus(user: AuthUser, transactionId: number) {
    await paymentModel.markExpiredTransactions();
    const transaction = await paymentModel.getTransactionWithPurchase(transactionId);
    if (!transaction) {
      throw new ApiError(404, "Payment transaction not found");
    }

    if (transaction.user_id !== user.user_id && user.role !== "admin") {
      throw new ApiError(403, "Access denied");
    }

    return {
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
    };
  }

  async confirmPayment(user: AuthUser, transactionId: number) {
    if (user.role !== "admin") {
      throw new ApiError(403, "Admin access required");
    }

    const enrollment = await paymentModel.confirmPaid(transactionId, user.user_id);
    if (!enrollment) {
      throw new ApiError(404, "Payment transaction not found");
    }

    return enrollment;
  }
}

export default new PaymentStatusService();
