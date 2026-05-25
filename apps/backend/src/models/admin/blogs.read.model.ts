import databaseService from "../../services/database.service.js";
import type { AdminListParams } from "../admin.model.js";
import { orderDirection, withLimitOffset } from "./adminModelHelpers.js";
import { buildBlogWhere } from "./blogs.helpers.js";

class AdminBlogsReadModel {
  async listBlogs(params: AdminListParams) {
    const { limit, offset } = withLimitOffset(params);
    const direction = orderDirection(params);
    const { values, whereSql } = buildBlogWhere(params);

    values.push(limit, offset);
    const result = await databaseService.executeQuery(
      `
        SELECT b.blog_id, b.title, b.slug, b.excerpt, b.content, b.category_id,
               bc.name AS category, bc.slug AS category_slug,
               b.cover_asset_id, b.image_url, b.video_asset_id, b.video_url, b.status, b.author_id, u.username AS author_username,
               b.published_at, b.created_at, b.updated_at,
               COALESCE(
                 json_agg(json_build_object('tag_id', bt.tag_id, 'name', bt.name, 'slug', bt.slug, 'tag_type', bt.tag_type) ORDER BY bt.name)
                 FILTER (WHERE bt.tag_id IS NOT NULL),
                 '[]'::json
               ) AS tags
        FROM "Blog" b
        LEFT JOIN "BlogCategory" bc ON bc.category_id = b.category_id
        LEFT JOIN "User" u ON u.user_id = b.author_id
        LEFT JOIN "BlogTagMap" btm ON btm.blog_id = b.blog_id
        LEFT JOIN "BlogTag" bt ON bt.tag_id = btm.tag_id
        WHERE ${whereSql}
        GROUP BY b.blog_id, bc.category_id, u.username
        ORDER BY b.blog_id ${direction}
        LIMIT $${values.length - 1} OFFSET $${values.length};
      `,
      values
    );
    return result.rows;
  }

  async countBlogs(params: AdminListParams): Promise<number> {
    const { values, whereSql } = buildBlogWhere(params);
    const result = await databaseService.executeQuery(
      `
        SELECT COUNT(DISTINCT b.blog_id)::int AS total_count
        FROM "Blog" b
        LEFT JOIN "BlogCategory" bc ON bc.category_id = b.category_id
        WHERE ${whereSql};
      `,
      values
    );
    return Number(result.rows[0]?.total_count || 0);
  }

  async getBlogById(blogId: number, ownerId?: number) {
    const values: unknown[] = [blogId];
    if (ownerId) values.push(ownerId);

    const result = await databaseService.executeQuery(
      `
        SELECT b.blog_id, b.title, b.slug, b.excerpt, b.content, b.category_id,
               bc.name AS category, bc.slug AS category_slug,
               b.cover_asset_id, b.image_url, b.video_asset_id, b.video_url, b.status, b.author_id, u.username AS author_username,
               b.published_at, b.created_at, b.updated_at,
               COALESCE(
                 json_agg(json_build_object('tag_id', bt.tag_id, 'name', bt.name, 'slug', bt.slug, 'tag_type', bt.tag_type) ORDER BY bt.name)
                 FILTER (WHERE bt.tag_id IS NOT NULL),
                 '[]'::json
               ) AS tags
        FROM "Blog" b
        LEFT JOIN "BlogCategory" bc ON bc.category_id = b.category_id
        LEFT JOIN "User" u ON u.user_id = b.author_id
        LEFT JOIN "BlogTagMap" btm ON btm.blog_id = b.blog_id
        LEFT JOIN "BlogTag" bt ON bt.tag_id = btm.tag_id
        WHERE b.blog_id = $1
          AND b.deleted_at IS NULL
          ${ownerId ? "AND b.author_id = $2" : ""}
        GROUP BY b.blog_id, bc.category_id, u.username;
      `,
      values
    );
    return result.rows[0] || null;
  }
}

export default new AdminBlogsReadModel();
