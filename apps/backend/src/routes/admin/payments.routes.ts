import { Router } from "express";
import adminPaymentsController from "../../controllers/admin/payments.controller.js";
import { asyncHandler } from "../../utils/http.js";

const router = Router();

router.get("/", asyncHandler(adminPaymentsController.listPayments));

export default router;
