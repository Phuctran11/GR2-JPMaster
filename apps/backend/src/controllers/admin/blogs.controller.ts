import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import adminBlogsService from "../../services/admin/blogs.service.js";
import { ownerScope } from "../../utils/adminContext.js";
import { created, message, ok, paginated, requireUser } from "../../utils/http.js";
import { parsePositiveInt } from "../../validators/common.validator.js";

export class AdminBlogsController {
  async listBlogs(req: Request, res: Response) {
    const { data, totalCount } = await adminBlogsService.listBlogs(req.query, ownerScope(req));
    return paginated(res, data, totalCount);
  }

  async createBlog(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);
    const data = await adminBlogsService.createBlog(req.body, user.user_id);
    return created(res, "Blog created successfully", data);
  }

  async updateBlog(req: Request, res: Response) {
    const blogId = parsePositiveInt(req.params.id, "blog ID");
    const data = await adminBlogsService.updateBlog(blogId, req.body, ownerScope(req));
    return ok(res, data, { message: "Blog updated successfully" });
  }

  async deleteBlog(req: Request, res: Response) {
    const blogId = parsePositiveInt(req.params.id, "blog ID");
    await adminBlogsService.deleteBlog(blogId, ownerScope(req));
    return message(res, "Blog hidden successfully");
  }
}

export default new AdminBlogsController();
