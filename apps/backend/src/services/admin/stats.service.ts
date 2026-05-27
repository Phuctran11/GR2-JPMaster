import adminStatsModel from "../../models/admin/stats.model.js";
import paymentModel from "../../models/payments/payment.model.js";

export class AdminStatsService {
  async getStats(ownerId?: number) {
    await paymentModel.markExpiredTransactions();
    return adminStatsModel.getStats(ownerId);
  }
}

export default new AdminStatsService();
