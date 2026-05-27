import databaseService from "../../services/database.service.js";
import { assertReturnedRow } from "../modelAssertions.js";
import { formatPurchase, type Purchase, type PurchaseStatus } from "./purchase.types.js";

export class PurchaseWriteModel {
  async createPurchase(
    userId: number,
    courseId: number,
    pricePaid: number,
    status: PurchaseStatus = "completed"
  ): Promise<Purchase> {
    const query = `
      INSERT INTO "Purchase" (
        user_id, course_id, price_paid, status, purchase_date
      )
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING purchase_id, user_id, course_id, purchase_date, price_paid, status;
    `;

    const result = await databaseService.executeQuery(query, [
      userId,
      courseId,
      pricePaid,
      status,
    ]);

    return formatPurchase(assertReturnedRow(result.rows[0], "Failed to create purchase record"));
  }

  async updatePurchaseStatus(purchaseId: number, status: PurchaseStatus): Promise<Purchase | null> {
    const query = `
      UPDATE "Purchase"
      SET status = $1
      WHERE purchase_id = $2
      RETURNING purchase_id, user_id, course_id, purchase_date, price_paid, status;
    `;

    const result = await databaseService.executeQuery(query, [status, purchaseId]);
    return result.rows[0] ? formatPurchase(result.rows[0]) : null;
  }

  async deletePurchase(purchaseId: number): Promise<boolean> {
    const query = `DELETE FROM "Purchase" WHERE purchase_id = $1;`;

    const result = await databaseService.executeQuery(query, [purchaseId]);
    return (result.rowCount ?? 0) > 0;
  }
}

export default new PurchaseWriteModel();
