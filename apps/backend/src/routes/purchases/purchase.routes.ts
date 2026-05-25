import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import purchaseController from "../../controllers/purchases/purchase.controller.js";
import { asyncHandler } from "../../utils/http.js";

const router = Router();

/**
 * Purchase Routes
 * Handles payment transactions, purchase history, and purchase-related operations
 */

// Get specific purchase details
router.get("/:purchaseId", authMiddleware, asyncHandler(purchaseController.getPurchase));

export default router;
