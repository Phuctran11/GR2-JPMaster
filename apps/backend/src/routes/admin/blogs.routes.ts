import { Router } from "express";
import adminBlogsController from "../../controllers/admin/blogs.controller.js";
import { asyncHandler } from "../../utils/http.js";

const router = Router();

router.get("/", asyncHandler(adminBlogsController.listBlogs));
router.post("/", asyncHandler(adminBlogsController.createBlog));
router.put("/:id", asyncHandler(adminBlogsController.updateBlog));
router.delete("/:id", asyncHandler(adminBlogsController.deleteBlog));

export default router;
