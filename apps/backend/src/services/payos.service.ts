import crypto from "crypto";

type PayOsCreatePaymentInput = {
  orderCode: number;
  amount: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  buyerName?: string;
  buyerEmail?: string;
  items?: Array<{ name: string; quantity: number; price: number }>;
};

type PayOsPaymentResponse = {
  code: string;
  desc: string;
  data?: {
    bin?: string;
    accountNumber?: string;
    accountName?: string;
    amount?: number;
    description?: string;
    orderCode?: number;
    currency?: string;
    paymentLinkId?: string;
    status?: string;
    checkoutUrl?: string;
    qrCode?: string;
  };
  signature?: string;
};

const getRequiredEnv = (key: string) => {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`${key} is required for payOS payments`);
  }
  return value;
};

const buildSortedDataString = (data: Record<string, unknown>) => {
  return Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join("&");
};

export class PayOsService {
  createSignature(data: Record<string, unknown>) {
    return crypto
      .createHmac("sha256", getRequiredEnv("PAYOS_CHECKSUM_KEY"))
      .update(buildSortedDataString(data))
      .digest("hex");
  }

  verifySignature(data: Record<string, unknown>, signature?: string | null) {
    if (!signature) return false;
    const expected = this.createSignature(data);
    const expectedBuffer = Buffer.from(expected);
    const signatureBuffer = Buffer.from(signature);
    if (expectedBuffer.length !== signatureBuffer.length) return false;
    return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  }

  async createPaymentLink(input: PayOsCreatePaymentInput) {
    const signaturePayload = {
      amount: Math.round(input.amount),
      cancelUrl: input.cancelUrl,
      description: input.description,
      orderCode: input.orderCode,
      returnUrl: input.returnUrl,
    };

    const response = await fetch("https://api-merchant.payos.vn/v2/payment-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": getRequiredEnv("PAYOS_CLIENT_ID"),
        "x-api-key": getRequiredEnv("PAYOS_API_KEY"),
      },
      body: JSON.stringify({
        ...signaturePayload,
        buyerName: input.buyerName,
        buyerEmail: input.buyerEmail,
        items: input.items,
        signature: this.createSignature(signaturePayload),
      }),
    });

    const payload = (await response.json()) as PayOsPaymentResponse;
    if (!response.ok || payload.code !== "00" || !payload.data?.checkoutUrl) {
      throw new Error(payload.desc || "Failed to create payOS payment link");
    }

    return payload;
  }

  verifyWebhook(body: any) {
    const data = body?.data;
    const signature = body?.signature;
    if (!data || typeof data !== "object") return false;
    return this.verifySignature(data, signature);
  }
}

export default new PayOsService();
