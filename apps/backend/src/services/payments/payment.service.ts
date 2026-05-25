import paymentCheckoutService from "./paymentCheckout.service.js";
import paymentStatusService from "./paymentStatus.service.js";
import paymentWebhookService from "./paymentWebhook.service.js";

export class PaymentService {
  createCoursePayOsPayment = paymentCheckoutService.createCoursePayOsPayment.bind(paymentCheckoutService);
  getPaymentStatus = paymentStatusService.getPaymentStatus.bind(paymentStatusService);
  confirmPayment = paymentStatusService.confirmPayment.bind(paymentStatusService);
  processPayOsWebhook = paymentWebhookService.processPayOsWebhook.bind(paymentWebhookService);
}

export default new PaymentService();
