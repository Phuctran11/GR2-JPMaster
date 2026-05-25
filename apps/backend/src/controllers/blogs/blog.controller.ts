import { Request, Response } from "express";
import blogService from "../../services/blogs/blog.service.js";
import { ok, paginated } from "../../utils/http.js";

export class BlogController {
  async listBlogs(req: Request, res: Response) {
    const result = await blogService.listBlogs(req.query);
    return paginated(res, result.blogs, result.totalCount);
  }

  async getBlog(req: Request, res: Response) {
    const blog = await blogService.getBlog(String(req.params.identifier));
    return ok(res, blog);
  }

  async listCategories(req: Request, res: Response) {
    const data = await blogService.listCategories();
    return paginated(res, data);
  }
}

export default new BlogController();
