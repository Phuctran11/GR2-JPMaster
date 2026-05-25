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

export interface CreatePayOsTransactionInput {
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
}

export interface ConfirmPayOsWebhookInput {
  orderCode: number;
  amount: number;
  paymentLinkId?: string | null;
  rawPayload: Record<string, unknown>;
}

export const paymentTransactionSelect = `
  payment_transaction_id, purchase_id, provider, provider_order_id, order_code,
  provider_payment_link_id, amount, currency, payment_content, qr_image_url,
  checkout_url, status, paid_at, expired_at,
  raw_response, created_at, updated_at
`;

export const formatPaymentTransaction = (row: any): PaymentTransaction => ({
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
