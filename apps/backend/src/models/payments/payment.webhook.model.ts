import databaseService from "../../services/database.service.js";
import paymentConfirmModel from "./payment.confirm.model.js";
import {
  buildPayOsAmountMismatchMetadata,
  buildPayOsConfirmationMetadata,
  isWebhookAmountUnderpaid,
} from "./paymentState.helpers.js";
import type { ConfirmPayOsWebhookInput } from "./payment.types.js";

export class PaymentWebhookModel {
  async confirmPayOsWebhook(input: ConfirmPayOsWebhookInput) {
    const result = await databaseService.executeQuery(
      `
        SELECT payment_transaction_id, amount, status
        FROM "PaymentTransaction"
        WHERE provider = 'payos'
          AND status = 'pending'
          AND order_code = $1
        ORDER BY created_at DESC
        LIMIT 1;
      `,
      [input.orderCode]
    );
    const transaction = result.rows[0];
    if (!transaction) return null;

    if (isWebhookAmountUnderpaid(input.amount, Number(transaction.amount))) {
      await databaseService.executeQuery(
        `
          UPDATE "PaymentTransaction"
          SET raw_response = COALESCE(raw_response, '{}'::jsonb) || $2::jsonb,
              updated_at = NOW()
          WHERE payment_transaction_id = $1;
        `,
        [transaction.payment_transaction_id, JSON.stringify(buildPayOsAmountMismatchMetadata(input))]
      );
      return null;
    }

    return paymentConfirmModel.confirmPaid(transaction.payment_transaction_id, null, buildPayOsConfirmationMetadata(input));
  }
}

export default new PaymentWebhookModel();
