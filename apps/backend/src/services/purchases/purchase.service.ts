import purchaseModel from "../../models/purchases/purchase.model.js";
import { ApiError } from "../../utils/http.js";

export class PurchaseService {
  async getPurchase(userId: number, purchaseId: number) {
    const purchase = await purchaseModel.getPurchaseById(purchaseId);
    if (!purchase) {
      throw new ApiError(404, "Purchase not found");
    }

    if (purchase.user_id !== userId) {
      throw new ApiError(403, "Access denied");
    }

    return purchase;
  }
}

export default new PurchaseService();
