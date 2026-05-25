import { Request, Response } from "express";
import adminPaymentsService from "../../services/admin/payments.service.js";
import { ownerScope } from "../../utils/adminContext.js";
import { ok } from "../../utils/http.js";

export class AdminPaymentsController {
  async listPayments(req: Request, res: Response) {
    const result = await adminPaymentsService.listPayments(req.query, ownerScope(req));
    return ok(res, result.data, { count: result.data.length, total_count: result.totalCount });
  }
}

export default new AdminPaymentsController();
