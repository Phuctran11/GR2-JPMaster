import databaseService from "../../services/database.service.js";

export class PurchaseRevenueModel {
  async getTotalRevenue(): Promise<number> {
    const query = `
      SELECT SUM(price_paid) as total
      FROM "Purchase"
      WHERE status = 'completed';
    `;

    const result = await databaseService.executeQuery(query, []);
    return result.rows[0]?.total ? Number(result.rows[0].total) : 0;
  }

  async getRevenueByCourse(courseId: number): Promise<number> {
    const query = `
      SELECT SUM(price_paid) as total
      FROM "Purchase"
      WHERE course_id = $1 AND status = 'completed';
    `;

    const result = await databaseService.executeQuery(query, [courseId]);
    return result.rows[0]?.total ? Number(result.rows[0].total) : 0;
  }
}

export default new PurchaseRevenueModel();
