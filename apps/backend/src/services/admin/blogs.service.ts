import { BLOG_STATUSES } from "../../constants/admin.constants.js";
import { BlogStatus } from "../../models/admin.model.js";
import adminBlogsModel from "../../models/admin/blogs.model.js";
import { ApiError } from "../../utils/http.js";
import { BodyInput, optionalNumber, parseAdminPagination, parseSortOrder, QueryInput, requireString, toNumberOrNull } from "../../validators/admin/common.validator.js";
import { parseTagList, slugify } from "../../validators/admin/blog.validator.js";

export class AdminBlogsService {
  async listBlogs(query: QueryInput, ownerId?: number) {
    const { limit, offset } = parseAdminPagination(query);
    const params = {
      limit,
      offset,
      search: String(query.search || ""),
      status: (query.status as BlogStatus | "all") || "all",
      sortOrder: parseSortOrder(query.sort_order),
      ownerId,
    };
    const [data, totalCount] = await Promise.all([
      adminBlogsModel.listBlogs(params),
      adminBlogsModel.countBlogs(params),
    ]);

    return { data, totalCount };
  }

  async createBlog(body: BodyInput, authorId: number) {
    const title = requireString(body.title);
    const status = (body.status || "draft") as BlogStatus;

    if (!title || !BLOG_STATUSES.includes(status)) {
      throw new ApiError(400, "title and valid status are required");
    }

    return adminBlogsModel.createBlog({
      title,
      slug: requireString(body.slug) || slugify(title),
      excerpt: requireString(body.excerpt) || null,
      content: requireString(body.content) || null,
      category_name: requireString(body.category_name ?? body.category) || null,
      tags: parseTagList(body.tags),
      cover_asset_id: toNumberOrNull(body.cover_asset_id),
      image_url: requireString(body.image_url) || null,
      video_asset_id: toNumberOrNull(body.video_asset_id),
      video_url: requireString(body.video_url) || null,
      status,
      author_id: authorId,
    });
  }

  async updateBlog(blogId: number, body: BodyInput, ownerId?: number) {
    const status = body.status as BlogStatus | undefined;
    const title = body.title === undefined ? undefined : requireString(body.title);
    const data = await adminBlogsModel.updateBlog(blogId, {
      title,
      slug: body.slug === undefined ? (title ? slugify(title) : undefined) : requireString(body.slug),
      excerpt: body.excerpt === undefined ? undefined : requireString(body.excerpt) || null,
      content: body.content === undefined ? undefined : requireString(body.content) || null,
      category_name: body.category_name === undefined && body.category === undefined ? undefined : requireString(body.category_name ?? body.category) || null,
      tags: body.tags === undefined ? undefined : parseTagList(body.tags),
      cover_asset_id: optionalNumber(body.cover_asset_id),
      image_url: body.image_url === undefined ? undefined : requireString(body.image_url) || null,
      video_asset_id: optionalNumber(body.video_asset_id),
      video_url: body.video_url === undefined ? undefined : requireString(body.video_url) || null,
      status,
    }, ownerId);

    if (!data) {
      throw new ApiError(404, "Blog not found or no changes provided");
    }

    return data;
  }

  async deleteBlog(blogId: number, ownerId?: number) {
    const deleted = await adminBlogsModel.deleteBlog(blogId, ownerId);
    if (!deleted) {
      throw new ApiError(404, "Blog not found");
    }
  }
}

export default new AdminBlogsService();
