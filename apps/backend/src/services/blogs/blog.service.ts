import type { SortOrder } from "../../models/admin.model.js";
import blogModel from "../../models/blogs/blog.model.js";
import { ApiError } from "../../utils/http.js";
import { QueryInput } from "../../validators/common.validator.js";

const parseSortOrder = (value: unknown): SortOrder => (value === "asc" ? "asc" : "desc");

export class BlogService {
  async listBlogs(query: QueryInput) {
    return blogModel.listPublishedBlogs({
      limit: Number(query.limit),
      offset: Number(query.offset),
      search: String(query.search || ""),
      category: String(query.category || ""),
      tag: String(query.tag || ""),
      publishedAfter: String(query.published_after || ""),
      sortOrder: parseSortOrder(query.sort_order),
    });
  }

  async getBlog(identifier: string) {
    const blog = await blogModel.getPublishedBlog(identifier);
    if (!blog) {
      throw new ApiError(404, "Blog not found");
    }

    return blog;
  }

  async listCategories() {
    return blogModel.listCategories();
  }
}

export default new BlogService();
