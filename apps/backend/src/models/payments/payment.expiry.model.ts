import databaseService from "../../services/database.service.js";

export class PaymentExpiryModel {
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
}

export default new PaymentExpiryModel();
