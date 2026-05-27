import databaseService from "../../services/database.service.js";
import { formatPaymentTransaction, paymentTransactionSelect, type PaymentTransaction } from "./payment.types.js";

export type PaymentStatusFilter = "all" | "pending" | "paid" | "failed" | "canceled" | "expired";

export type AdminPaymentListParams = {
  limit: number;
  offset: number;
  search: string;
  status: PaymentStatusFilter;
  sortOrder: "asc" | "desc";
  ownerId?: number;
};

export class PaymentReadModel {
  async getTransactionById(transactionId: number): Promise<PaymentTransaction | null> {
    const result = await databaseService.executeQuery(
      `
        SELECT ${paymentTransactionSelect}
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

  async listAdminTransactions(params: AdminPaymentListParams) {
    const values: unknown[] = [];
    const clauses: string[] = [];

    if (params.ownerId) {
      values.push(params.ownerId);
      clauses.push(`c.created_by = $${values.length}`);
    }

    if (params.status !== "all") {
      values.push(params.status);
      clauses.push(`pt.status = $${values.length}`);
    }

    if (params.search.trim()) {
      values.push(`%${params.search.trim()}%`);
      clauses.push(`(
        u.username ILIKE $${values.length}
        OR u.email ILIKE $${values.length}
        OR c.title ILIKE $${values.length}
        OR pt.payment_content ILIKE $${values.length}
        OR pt.provider_order_id ILIKE $${values.length}
        OR pt.order_code::text ILIKE $${values.length}
      )`);
    }

    values.push(params.limit, params.offset);
    const whereSql = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const direction = params.sortOrder === "asc" ? "ASC" : "DESC";

    const result = await databaseService.executeQuery(
      `
        SELECT pt.payment_transaction_id, pt.purchase_id, pt.provider, pt.provider_order_id,
               pt.order_code, pt.provider_payment_link_id, pt.amount, pt.currency,
               pt.payment_content, pt.qr_image_url, pt.checkout_url, pt.status,
               pt.paid_at, pt.expired_at, pt.created_at, pt.updated_at,
               p.user_id, u.username, u.email,
               p.course_id, c.title AS course_title,
               p.price_paid, p.status AS purchase_status
        FROM "PaymentTransaction" pt
        JOIN "Purchase" p ON p.purchase_id = pt.purchase_id
        JOIN "User" u ON u.user_id = p.user_id
        JOIN "Course" c ON c.course_id = p.course_id
        ${whereSql}
        ORDER BY pt.created_at ${direction}, pt.payment_transaction_id ${direction}
        LIMIT $${values.length - 1} OFFSET $${values.length};
      `,
      values
    );

    return result.rows.map((row) => ({
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
      created_at: row.created_at,
      updated_at: row.updated_at,
      user_id: row.user_id,
      username: row.username,
      email: row.email,
      course_id: row.course_id,
      course_title: row.course_title,
      price_paid: Number(row.price_paid),
      purchase_status: row.purchase_status,
    }));
  }

  async countAdminTransactions(params: Omit<AdminPaymentListParams, "limit" | "offset" | "sortOrder">) {
    const values: unknown[] = [];
    const clauses: string[] = [];

    if (params.ownerId) {
      values.push(params.ownerId);
      clauses.push(`c.created_by = $${values.length}`);
    }

    if (params.status !== "all") {
      values.push(params.status);
      clauses.push(`pt.status = $${values.length}`);
    }

    if (params.search.trim()) {
      values.push(`%${params.search.trim()}%`);
      clauses.push(`(
        u.username ILIKE $${values.length}
        OR u.email ILIKE $${values.length}
        OR c.title ILIKE $${values.length}
        OR pt.payment_content ILIKE $${values.length}
        OR pt.provider_order_id ILIKE $${values.length}
        OR pt.order_code::text ILIKE $${values.length}
      )`);
    }

    const whereSql = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const result = await databaseService.executeQuery(
      `
        SELECT COUNT(*)::int AS total_count
        FROM "PaymentTransaction" pt
        JOIN "Purchase" p ON p.purchase_id = pt.purchase_id
        JOIN "User" u ON u.user_id = p.user_id
        JOIN "Course" c ON c.course_id = p.course_id
        ${whereSql};
      `,
      values
    );

    return Number(result.rows[0]?.total_count ?? 0);
  }
}

export default new PaymentReadModel();

