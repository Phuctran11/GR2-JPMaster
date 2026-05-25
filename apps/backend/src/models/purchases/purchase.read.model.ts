import databaseService from "../../services/database.service.js";
import { formatPurchase, type Purchase } from "./purchase.types.js";

export class PurchaseReadModel {
  async getPurchaseById(purchaseId: number): Promise<Purchase | null> {
    const query = `
      SELECT purchase_id, user_id, course_id, purchase_date, price_paid, status
      FROM "Purchase"
      WHERE purchase_id = $1;
    `;

    const result = await databaseService.executeQuery(query, [purchaseId]);
    return result.rows[0] ? formatPurchase(result.rows[0]) : null;
  }

  async getPurchasesByUserId(userId: number, limit: number = 10, offset: number = 0): Promise<Purchase[]> {
    const limitSafe = Math.min(limit, 100);

    const query = `
      SELECT purchase_id, user_id, course_id, purchase_date, price_paid, status
      FROM "Purchase"
      WHERE user_id = $1 AND status = 'completed'
      ORDER BY purchase_date DESC
      LIMIT $2 OFFSET $3;
    `;

    const result = await databaseService.executeQuery(query, [userId, limitSafe, offset]);
    return result.rows.map(formatPurchase);
  }

  async getPurchaseByUserAndCourse(userId: number, courseId: number): Promise<Purchase | null> {
    const query = `
      SELECT purchase_id, user_id, course_id, purchase_date, price_paid, status
      FROM "Purchase"
      WHERE user_id = $1 AND course_id = $2
      ORDER BY purchase_date DESC
      LIMIT 1;
    `;

    const result = await databaseService.executeQuery(query, [userId, courseId]);
    return result.rows[0] ? formatPurchase(result.rows[0]) : null;
  }
}

export default new PurchaseReadModel();
