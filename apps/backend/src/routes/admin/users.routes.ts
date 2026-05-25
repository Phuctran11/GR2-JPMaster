import { Router } from "express";
import adminUsersController from "../../controllers/admin/users.controller.js";
import { asyncHandler } from "../../utils/http.js";

const router = Router();

router.get("/", asyncHandler(adminUsersController.listUsers));
router.post("/", asyncHandler(adminUsersController.createUser));
router.put("/:id", asyncHandler(adminUsersController.updateUser));
router.delete("/:id", asyncHandler(adminUsersController.deleteUser));

export default router;
