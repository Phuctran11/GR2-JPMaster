import paymentModel from "../../models/payments/payment.model.js";
import { ApiError } from "../../utils/http.js";
import payOsService from "./payos.service.js";
import type { AuthUser } from "./payment.helpers.js";

export class PaymentStatusService {
  async getPaymentStatus(user: AuthUser, transactionId: number) {
    await paymentModel.markExpiredTransactions();
    let transaction = await paymentModel.getTransactionWithPurchase(transactionId);
    if (!transaction) {
      throw new ApiError(404, "Payment transaction not found");
    }

    if (transaction.user_id !== user.user_id && user.role !== "admin") {
      throw new ApiError(403, "Access denied");
    }

    if (transaction.provider === "payos" && transaction.status !== "paid" && transaction.order_code) {
      const payOsInfo = await payOsService.getPaymentLinkInformation(Number(transaction.order_code));
      const payOsData = payOsInfo.data;
      const payOsStatus = String(payOsData?.status || "").toUpperCase();
      const amountPaid = Number(payOsData?.amountPaid ?? 0);
      const expectedAmount = Number(transaction.amount);

      if (payOsStatus === "PAID" || (Number.isFinite(amountPaid) && amountPaid >= expectedAmount)) {
        await paymentModel.confirmPaid(transaction.payment_transaction_id, null, {
          source: "payos_status_sync",
          payos_status: payOsStatus,
          payos_status_response: payOsInfo,
        });
        transaction = await paymentModel.getTransactionWithPurchase(transactionId);
      }
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
