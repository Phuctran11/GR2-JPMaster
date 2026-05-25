import { Router } from "express";
import blogController from "../../controllers/blogs/blog.controller.js";
import { asyncHandler } from "../../utils/http.js";

const router = Router();

router.get("/", asyncHandler(blogController.listBlogs));
router.get("/categories", asyncHandler(blogController.listCategories));
router.get("/:identifier", asyncHandler(blogController.getBlog));

export default router;
