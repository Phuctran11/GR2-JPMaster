import databaseService from "../services/database.service.js";
import type { BlogStatus, SortOrder } from "./admin.model.js";

export interface BlogListParams {
  limit?: number;
  offset?: number;
  search?: string;
  category?: string;
  tag?: string;
  publishedAfter?: string;
  sortOrder?: SortOrder;
}

const withLimitOffset = (params: BlogListParams) => ({
  limit: Math.min(Number(params.limit) || 20, 100),
  offset: Math.max(Number(params.offset) || 0, 0),
});

const orderDirection = (params: BlogListParams) => (params.sortOrder === "asc" ? "ASC" : "DESC");

export class BlogModel {
  async listPublishedBlogs(params: BlogListParams) {
    const { limit, offset } = withLimitOffset(params);
    const direction = orderDirection(params);
    const values: unknown[] = [];
    const where: string[] = [`b.deleted_at IS NULL`, `b.status = 'published'`, `b.published_at IS NOT NULL`];

    if (params.search?.trim()) {
      values.push(`%${params.search.trim()}%`);
      where.push(`(b.title ILIKE $${values.length} OR b.excerpt ILIKE $${values.length} OR b.content ILIKE $${values.length})`);
    }

    if (params.category?.trim()) {
      values.push(params.category.trim());
      where.push(`(bc.slug = $${values.length} OR bc.name = $${values.length})`);
    }

    if (params.tag?.trim()) {
      values.push(params.tag.trim());
      where.push(`
        EXISTS (
          SELECT 1
          FROM "BlogTagMap" filter_btm
          JOIN "BlogTag" filter_bt ON filter_bt.tag_id = filter_btm.tag_id
          WHERE filter_btm.blog_id = b.blog_id
            AND (filter_bt.slug = $${values.length} OR filter_bt.name = $${values.length})
        )
      `);
    }

    if (params.publishedAfter?.trim()) {
      values.push(params.publishedAfter.trim());
      where.push(`b.published_at >= $${values.length}::timestamp`);
    }

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
        WHERE ${where.join(" AND ")}
        GROUP BY b.blog_id, bc.category_id, u.username
        ORDER BY b.published_at ${direction}, b.blog_id ${direction}
        LIMIT $${values.length - 1} OFFSET $${values.length};
      `,
      values
    );
    return result.rows;
  }

  async getPublishedBlog(identifier: string) {
    const isNumericId = /^\d+$/.test(identifier);
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
        WHERE b.deleted_at IS NULL
          AND b.status = $1
          AND b.published_at IS NOT NULL
          AND ${isNumericId ? "b.blog_id = $2" : "b.slug = $2"}
        GROUP BY b.blog_id, bc.category_id, u.username;
      `,
      ["published" satisfies BlogStatus, isNumericId ? Number(identifier) : identifier]
    );
    return result.rows[0] || null;
  }

  async listCategories() {
    const result = await databaseService.executeQuery(
      `
        SELECT bc.category_id, bc.name, bc.slug, COUNT(b.blog_id)::int AS blog_count
        FROM "BlogCategory" bc
        JOIN "Blog" b ON b.category_id = bc.category_id
          AND b.deleted_at IS NULL
          AND b.status = 'published'
          AND b.published_at IS NOT NULL
        GROUP BY bc.category_id
        ORDER BY bc.name ASC;
      `
    );
    return result.rows;
  }
}

export default new BlogModel();
