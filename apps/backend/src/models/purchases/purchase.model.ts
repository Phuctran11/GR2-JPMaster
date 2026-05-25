import purchaseReadModel from "./purchase.read.model.js";
import purchaseRevenueModel from "./purchase.revenue.model.js";
import type { Purchase, PurchaseStatus } from "./purchase.types.js";
import purchaseWriteModel from "./purchase.write.model.js";

export type { Purchase, PurchaseStatus };

export class PurchaseModel {
  createPurchase = purchaseWriteModel.createPurchase.bind(purchaseWriteModel);
  updatePurchaseStatus = purchaseWriteModel.updatePurchaseStatus.bind(purchaseWriteModel);
  deletePurchase = purchaseWriteModel.deletePurchase.bind(purchaseWriteModel);

  getPurchaseById = purchaseReadModel.getPurchaseById.bind(purchaseReadModel);
  getPurchasesByUserId = purchaseReadModel.getPurchasesByUserId.bind(purchaseReadModel);
  getPurchaseByUserAndCourse = purchaseReadModel.getPurchaseByUserAndCourse.bind(purchaseReadModel);

  getTotalRevenue = purchaseRevenueModel.getTotalRevenue.bind(purchaseRevenueModel);
  getRevenueByCourse = purchaseRevenueModel.getRevenueByCourse.bind(purchaseRevenueModel);
}

export default new PurchaseModel();
