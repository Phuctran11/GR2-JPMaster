import { Router } from "express";
import blogController from "../controllers/blog.controller.js";

const router = Router();

router.get("/", blogController.listBlogs.bind(blogController));
router.get("/categories", blogController.listCategories.bind(blogController));
router.get("/:identifier", blogController.getBlog.bind(blogController));

export default router;
