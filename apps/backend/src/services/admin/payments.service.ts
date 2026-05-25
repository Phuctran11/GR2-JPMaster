import paymentModel from "../../models/payments/payment.model.js";
import type { PaymentStatusFilter } from "../../models/payments/payment.read.model.js";
import { parseAdminPagination, parseSortOrder, type QueryInput } from "../../validators/admin/common.validator.js";

const paymentStatuses: PaymentStatusFilter[] = ["all", "pending", "paid", "failed", "canceled", "expired"];

export class AdminPaymentsService {
  async listPayments(query: QueryInput, ownerId?: number) {
    await paymentModel.markExpiredTransactions();

    const { limit, offset } = parseAdminPagination(query);
    const rawStatus = String(query.status || "all") as PaymentStatusFilter;
    const status = paymentStatuses.includes(rawStatus) ? rawStatus : "all";
    const params = {
      limit,
      offset,
      search: String(query.search || ""),
      status,
      sortOrder: parseSortOrder(query.sort_order),
      ownerId,
    };

    const [data, totalCount] = await Promise.all([
      paymentModel.listAdminTransactions(params),
      paymentModel.countAdminTransactions(params),
    ]);

    return { data, totalCount };
  }
}

export default new AdminPaymentsService();
