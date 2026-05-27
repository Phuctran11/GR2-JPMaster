import paymentConfirmModel from "./payment.confirm.model.js";
import paymentCreateModel from "./payment.create.model.js";
import paymentExpiryModel from "./payment.expiry.model.js";
import paymentWebhookModel from "./payment.webhook.model.js";

export class PaymentWriteModel {
  createPayOsTransaction = paymentCreateModel.createPayOsTransaction.bind(paymentCreateModel);
  markExpiredTransactions = paymentExpiryModel.markExpiredTransactions.bind(paymentExpiryModel);
  confirmPaid = paymentConfirmModel.confirmPaid.bind(paymentConfirmModel);
  confirmPayOsWebhook = paymentWebhookModel.confirmPayOsWebhook.bind(paymentWebhookModel);
}

export default new PaymentWriteModel();
