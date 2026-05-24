import { NextFunction, Request, Response } from "express";
import blogModel from "../models/blog.model.js";
import type { SortOrder } from "../models/admin.model.js";

const parseSortOrder = (value: unknown): SortOrder => (value === "asc" ? "asc" : "desc");

export class BlogController {
  async listBlogs(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await blogModel.listPublishedBlogs({
        limit: Number(req.query.limit),
        offset: Number(req.query.offset),
        search: String(req.query.search || ""),
        category: String(req.query.category || ""),
        tag: String(req.query.tag || ""),
        publishedAfter: String(req.query.published_after || ""),
        sortOrder: parseSortOrder(req.query.sort_order),
      });
      return res.status(200).json({ data, count: data.length });
    } catch (error) {
      next(error);
    }
  }

  async getBlog(req: Request, res: Response, next: NextFunction) {
    try {
      const blog = await blogModel.getPublishedBlog(String(req.params.identifier));
      if (!blog) return res.status(404).json({ error: "Blog not found" });
      return res.status(200).json({ data: blog });
    } catch (error) {
      next(error);
    }
  }

  async listCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await blogModel.listCategories();
      return res.status(200).json({ data, count: data.length });
    } catch (error) {
      next(error);
    }
  }
}

export default new BlogController();
