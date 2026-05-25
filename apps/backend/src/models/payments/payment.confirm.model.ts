import databaseService from "../../services/database.service.js";
import { buildPaymentConfirmationMetadata } from "./paymentState.helpers.js";

export class PaymentConfirmModel {
  async confirmPaid(transactionId: number, confirmedBy: number | null, metadata: Record<string, unknown> = {}) {
    return databaseService.withTransaction(async (client) => {
      const transactionResult = await client.query(
        `
          SELECT pt.payment_transaction_id, pt.purchase_id, pt.status,
                 p.user_id, p.course_id, p.price_paid
          FROM "PaymentTransaction" pt
          JOIN "Purchase" p ON p.purchase_id = pt.purchase_id
          WHERE pt.payment_transaction_id = $1
          FOR UPDATE;
        `,
        [transactionId]
      );
      const transaction = transactionResult.rows[0];
      if (!transaction) {
        return null;
      }

      if (transaction.status !== "paid") {
        await client.query(
          `
            UPDATE "PaymentTransaction"
            SET status = 'paid',
                paid_at = COALESCE(paid_at, NOW()),
                raw_response = COALESCE(raw_response, '{}'::jsonb) || $2::jsonb,
                updated_at = NOW()
            WHERE payment_transaction_id = $1;
          `,
          [transactionId, JSON.stringify(buildPaymentConfirmationMetadata(confirmedBy, metadata))]
        );
      }

      await client.query(
        `
          UPDATE "Purchase"
          SET status = 'completed'
          WHERE purchase_id = $1;
        `,
        [transaction.purchase_id]
      );

      const enrollmentResult = await client.query(
        `
          INSERT INTO "CourseEnrollment" (user_id, course_id, enrollment_date, status)
          VALUES ($1, $2, NOW(), 'active')
          ON CONFLICT (user_id, course_id)
          DO UPDATE SET status = 'active'
          RETURNING enrollment_id, user_id, course_id, enrollment_date, status;
        `,
        [transaction.user_id, transaction.course_id]
      );

      return enrollmentResult.rows[0];
    });
  }
}

export default new PaymentConfirmModel();
