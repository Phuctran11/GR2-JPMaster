import databaseService from "../../services/database.service.js";
import { assertReturnedRow } from "../modelAssertions.js";
import { formatPaymentTransaction, type CreatePayOsTransactionInput } from "./payment.types.js";

export class PaymentCreateModel {
  async createPayOsTransaction(input: CreatePayOsTransactionInput) {
    return databaseService.withTransaction(async (client) => {
      const purchaseResult = await client.query(
        `
          INSERT INTO "Purchase" (user_id, course_id, price_paid, status, purchase_date)
          VALUES ($1, $2, $3, 'pending', NOW())
          RETURNING purchase_id, user_id, course_id, purchase_date, price_paid, status;
        `,
        [input.userId, input.courseId, input.amount]
      );
      const purchase = assertReturnedRow(purchaseResult.rows[0], "Failed to create purchase record");

      const transactionResult = await client.query(
        `
          INSERT INTO "PaymentTransaction" (
            purchase_id, provider, provider_order_id, order_code, provider_payment_link_id,
            amount, currency, payment_content, qr_image_url, checkout_url, status, expired_at, raw_response,
            created_at, updated_at
          )
          VALUES ($1, 'payos', $2, $3, $4, $5, 'VND', $6, $7, $8, 'pending', NOW() + ($9::int * interval '1 minute'), $10::jsonb, NOW(), NOW())
          RETURNING payment_transaction_id, purchase_id, provider, provider_order_id, order_code,
                    provider_payment_link_id, amount, currency, payment_content, qr_image_url,
                    checkout_url, status, paid_at, expired_at,
                    raw_response, created_at, updated_at;
        `,
        [
          purchase.purchase_id,
          String(input.orderCode),
          input.orderCode,
          input.paymentLinkId ?? null,
          input.amount,
          input.paymentContent,
          input.qrCode || input.checkoutUrl,
          input.checkoutUrl,
          input.expiresInMinutes,
          JSON.stringify(input.rawResponse),
        ]
      );
      const transaction = assertReturnedRow(transactionResult.rows[0], "Failed to create payment transaction");

      return {
        purchase,
        transaction: formatPaymentTransaction(transaction),
      };
    });
  }
}

export default new PaymentCreateModel();
