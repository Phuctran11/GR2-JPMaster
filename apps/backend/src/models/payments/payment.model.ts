import paymentReadModel from "./payment.read.model.js";
import type { PaymentTransaction } from "./payment.types.js";
import paymentWriteModel from "./payment.write.model.js";

export type { PaymentTransaction };

export class PaymentModel {
  createPayOsTransaction = paymentWriteModel.createPayOsTransaction.bind(paymentWriteModel);
  markExpiredTransactions = paymentWriteModel.markExpiredTransactions.bind(paymentWriteModel);
  confirmPaid = paymentWriteModel.confirmPaid.bind(paymentWriteModel);
  confirmPayOsWebhook = paymentWriteModel.confirmPayOsWebhook.bind(paymentWriteModel);

  getTransactionById = paymentReadModel.getTransactionById.bind(paymentReadModel);
  getTransactionWithPurchase = paymentReadModel.getTransactionWithPurchase.bind(paymentReadModel);
  listAdminTransactions = paymentReadModel.listAdminTransactions.bind(paymentReadModel);
  countAdminTransactions = paymentReadModel.countAdminTransactions.bind(paymentReadModel);
}

export default new PaymentModel();

