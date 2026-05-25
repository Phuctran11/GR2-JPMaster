import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import purchaseService from "../../services/purchases/purchase.service.js";
import { ok, requireUser } from "../../utils/http.js";
import { parsePositiveInt } from "../../validators/common.validator.js";

export class PurchaseController {

  async getPurchase(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);

    const purchaseId = parsePositiveInt(req.params.purchaseId, "purchase ID");
    const purchase = await purchaseService.getPurchase(user.user_id, purchaseId);

    return ok(res, purchase);
  }


}

export default new PurchaseController();
