export type AuthUser = {
  user_id: number;
  email: string;
  role: string;
};

export type PayOsWebhookPayload = {
  code?: unknown;
  data?: {
    orderCode?: unknown;
    amount?: unknown;
    code?: unknown;
    status?: unknown;
    paymentLinkId?: unknown;
  };
};

export const buildFrontendUrl = (path: string) => {
  const baseUrl = getFrontendUrl();
  return `${baseUrl.replace(/\/$/, "")}${path}`;
};

export const buildPayOsRedirectUrl = (envKey: "PAYOS_RETURN_URL" | "PAYOS_CANCEL_URL", courseId: number) => {
  const configuredUrl = process.env[envKey]?.trim();
  const coursePath = `/courses/${courseId}`;

  if (!configuredUrl) return buildFrontendUrl(coursePath);
  if (configuredUrl.includes("{courseId}")) return configuredUrl.replaceAll("{courseId}", String(courseId));

  try {
    const url = new URL(configuredUrl);
    if (url.pathname === "/" || url.pathname === "") {
      url.pathname = coursePath;
      return url.toString();
    }
  } catch {
    return configuredUrl;
  }

  return configuredUrl;
};

export const createPayOsOrderCode = () => {
  const timestampPart = Date.now() % 1_000_000_000;
  const randomPart = Math.floor(Math.random() * 1000);
  return timestampPart * 1000 + randomPart;
};

export const getPaymentExpireMinutes = () => {
  const configuredMinutes = Number(process.env.PAYOS_PAYMENT_EXPIRE_MINUTES || 30);
  return Number.isFinite(configuredMinutes) ? configuredMinutes : 30;
};

export const isPaidPayOsWebhook = (body: PayOsWebhookPayload) => {
  const data = body.data ?? {};
  const code = String(data.code || body.code || "");
  const status = String(data.status || "");
  return code === "00" || status === "PAID";
};
import { getFrontendUrl } from "../../config/runtime.js";
