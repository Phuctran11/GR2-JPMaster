import pool from "../config/database.js";
import databaseService from "../services/database.service.js";

export interface PaymentTransaction {
  payment_transaction_id: number;
  purchase_id: number;
  provider: "payos";
  provider_order_id: string;
  order_code: number | null;
  provider_payment_link_id: string | null;
  amount: number;
  currency: string;
  payment_content: string;
  qr_image_url: string;
  checkout_url: string | null;
  status: "pending" | "paid" | "failed" | "canceled" | "expired";
  paid_at: Date | null;
  expired_at: Date | null;
  raw_response: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

const formatPaymentTransaction = (row: any): PaymentTransaction => ({
  payment_transaction_id: row.payment_transaction_id,
  purchase_id: row.purchase_id,
  provider: row.provider,
  provider_order_id: row.provider_order_id,
  order_code: row.order_code == null ? null : Number(row.order_code),
  provider_payment_link_id: row.provider_payment_link_id,
  amount: Number(row.amount),
  currency: row.currency,
  payment_content: row.payment_content,
  qr_image_url: row.qr_image_url,
  checkout_url: row.checkout_url,
  status: row.status,
  paid_at: row.paid_at,
  expired_at: row.expired_at,
  raw_response: row.raw_response,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export class PaymentModel {
  async createPayOsTransaction(input: {
    userId: number;
    courseId: number;
    amount: number;
    orderCode: number;
    paymentContent: string;
    checkoutUrl: string;
    qrCode?: string | null;
    paymentLinkId?: string | null;
    rawResponse: Record<string, unknown>;
    expiresInMinutes: number;
  }) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const purchaseResult = await client.query(
        `
          INSERT INTO "Purchase" (user_id, course_id, price_paid, status, purchase_date)
          VALUES ($1, $2, $3, 'pending', NOW())
          RETURNING purchase_id, user_id, course_id, purchase_date, price_paid, status;
        `,
        [input.userId, input.courseId, input.amount]
      );
      const purchase = purchaseResult.rows[0];

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

      await client.query("COMMIT");
      return {
        purchase,
        transaction: formatPaymentTransaction(transactionResult.rows[0]),
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getTransactionById(transactionId: number): Promise<PaymentTransaction | null> {
    const result = await databaseService.executeQuery(
      `
        SELECT payment_transaction_id, purchase_id, provider, provider_order_id, order_code,
               provider_payment_link_id, amount, currency, payment_content, qr_image_url,
               checkout_url, status, paid_at, expired_at,
               raw_response, created_at, updated_at
        FROM "PaymentTransaction"
        WHERE payment_transaction_id = $1;
      `,
      [transactionId]
    );
    return result.rows[0] ? formatPaymentTransaction(result.rows[0]) : null;
  }

  async getTransactionWithPurchase(transactionId: number) {
    const result = await databaseService.executeQuery(
      `
        SELECT pt.payment_transaction_id, pt.purchase_id, pt.provider, pt.provider_order_id,
               pt.order_code, pt.provider_payment_link_id, pt.amount, pt.currency,
               pt.payment_content, pt.qr_image_url, pt.checkout_url, pt.status,
               pt.paid_at, pt.expired_at, pt.raw_response, pt.created_at, pt.updated_at,
               p.user_id, p.course_id, p.price_paid, p.status AS purchase_status
        FROM "PaymentTransaction" pt
        JOIN "Purchase" p ON p.purchase_id = pt.purchase_id
        WHERE pt.payment_transaction_id = $1;
      `,
      [transactionId]
    );
    return result.rows[0] || null;
  }

  async markExpiredTransactions() {
    await databaseService.executeQuery(
      `
        WITH expired AS (
          UPDATE "PaymentTransaction"
          SET status = 'expired', updated_at = NOW()
          WHERE status = 'pending'
            AND expired_at IS NOT NULL
            AND expired_at < NOW()
          RETURNING purchase_id
        )
        UPDATE "Purchase" p
        SET status = 'canceled'
        FROM expired e
        WHERE p.purchase_id = e.purchase_id
          AND p.status = 'pending';
      `
    );
  }

  async confirmPaid(transactionId: number, confirmedBy: number | null, metadata: Record<string, unknown> = {}) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

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
        await client.query("ROLLBACK");
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
          [transactionId, JSON.stringify({ confirmed_by: confirmedBy, confirmed_at: new Date().toISOString(), ...metadata })]
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

      await client.query("COMMIT");
      return enrollmentResult.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async confirmPayOsWebhook(input: {
    orderCode: number;
    amount: number;
    paymentLinkId?: string | null;
    rawPayload: Record<string, unknown>;
  }) {
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

    if (Number(input.amount) < Number(transaction.amount)) {
      await databaseService.executeQuery(
        `
          UPDATE "PaymentTransaction"
          SET raw_response = COALESCE(raw_response, '{}'::jsonb) || $2::jsonb,
              updated_at = NOW()
          WHERE payment_transaction_id = $1;
        `,
        [
          transaction.payment_transaction_id,
          JSON.stringify({ webhook_error: "amount_mismatch", received_amount: input.amount, raw_payload: input.rawPayload }),
        ]
      );
      return null;
    }

    return this.confirmPaid(transaction.payment_transaction_id, null, {
      source: "payos_webhook",
      payment_link_id: input.paymentLinkId,
      raw_payload: input.rawPayload,
    });
  }
}

export default new PaymentModel();
