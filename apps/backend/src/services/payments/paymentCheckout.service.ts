import courseModel from "../../models/courses/course.model.js";
import enrollmentModel from "../../models/enrollments/enrollment.model.js";
import paymentModel from "../../models/payments/payment.model.js";
import { ApiError } from "../../utils/http.js";
import payOsService from "./payos.service.js";
import {
  buildPayOsRedirectUrl,
  createPayOsOrderCode,
  getPaymentExpireMinutes,
  type AuthUser,
} from "./payment.helpers.js";

export class PaymentCheckoutService {
  async createCoursePayOsPayment(user: AuthUser, courseId: number) {
    const course = await courseModel.getCourseById(courseId);
    if (!course) {
      throw new ApiError(404, "Course not found");
    }

    const alreadyEnrolled = await enrollmentModel.checkUserCourseAccess(user.user_id, courseId);
    if (alreadyEnrolled) {
      throw new ApiError(409, "User already enrolled in this course");
    }

    const amount = Number(course.price);
    if (!Number.isFinite(amount) || amount <= 0) {
      const { enrollment, purchase } = await enrollmentModel.enrollUserWithCompletedPurchase(user.user_id, courseId, 0);
      return {
        message: "Free course enrolled successfully",
        data: { enrollment, purchase, payment_required: false },
      };
    }

    const orderCode = createPayOsOrderCode();
    const description = `JPM${orderCode}`;
    const payOsResponse = await payOsService.createPaymentLink({
      orderCode,
      amount,
      description,
      buyerEmail: user.email,
      buyerName: user.email,
      returnUrl: buildPayOsRedirectUrl("PAYOS_RETURN_URL", courseId),
      cancelUrl: buildPayOsRedirectUrl("PAYOS_CANCEL_URL", courseId),
      items: [{ name: course.title, quantity: 1, price: Math.round(amount) }],
    });

    const paymentRecord = await paymentModel.createPayOsTransaction({
      userId: user.user_id,
      courseId,
      amount,
      orderCode,
      paymentContent: description,
      checkoutUrl: payOsResponse.data?.checkoutUrl || "",
      qrCode: payOsResponse.data?.qrCode || null,
      paymentLinkId: payOsResponse.data?.paymentLinkId || null,
      rawResponse: payOsResponse as unknown as Record<string, unknown>,
      expiresInMinutes: getPaymentExpireMinutes(),
    });

    return {
      message: "payOS payment created",
      data: {
        payment_required: true,
        purchase: paymentRecord.purchase,
        transaction: paymentRecord.transaction,
        course: {
          course_id: course.course_id,
          title: course.title,
          price: amount,
        },
      },
    };
  }
}

export default new PaymentCheckoutService();
