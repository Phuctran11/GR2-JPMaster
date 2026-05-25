import type { ConfirmPayOsWebhookInput } from "./payment.types.js";

export const buildPaymentConfirmationMetadata = (
  confirmedBy: number | null,
  metadata: Record<string, unknown>
) => ({
  confirmed_by: confirmedBy,
  confirmed_at: new Date().toISOString(),
  ...metadata,
});

export const isWebhookAmountUnderpaid = (paidAmount: number, expectedAmount: number) =>
  Number(paidAmount) < Number(expectedAmount);

export const buildPayOsAmountMismatchMetadata = (input: ConfirmPayOsWebhookInput) => ({
  webhook_error: "amount_mismatch",
  received_amount: input.amount,
  raw_payload: input.rawPayload,
});

export const buildPayOsConfirmationMetadata = (input: ConfirmPayOsWebhookInput) => ({
  source: "payos_webhook",
  payment_link_id: input.paymentLinkId,
  raw_payload: input.rawPayload,
});
