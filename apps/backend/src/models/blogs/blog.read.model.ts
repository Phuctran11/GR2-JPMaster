import databaseService from "../../services/database.service.js";
import type { BlogStatus } from "../admin.model.js";
import { orderDirection, WhereBuilder, withLimitOffset } from "../sqlHelpers.js";
import { blogSelectWithTags, type BlogListParams } from "./blog.types.js";

const buildPublishedBlogWhere = (params: BlogListParams) => {
  const where = new WhereBuilder([`b.deleted_at IS NULL`, `b.status = 'published'`, `b.published_at IS NOT NULL`]);

  if (params.search?.trim()) {
    const search = `%${params.search.trim()}%`;
    where.add(`(b.title ILIKE ? OR b.excerpt ILIKE ? OR b.content ILIKE ?)`, search, search, search);
  }

  if (params.category?.trim()) {
    const category = params.category.trim();
    where.add(`(bc.slug = ? OR bc.name = ?)`, category, category);
  }

  if (params.tag?.trim()) {
    const tag = params.tag.trim();
    where.add(`
      EXISTS (
        SELECT 1
        FROM "BlogTagMap" filter_btm
        JOIN "BlogTag" filter_bt ON filter_bt.tag_id = filter_btm.tag_id
        WHERE filter_btm.blog_id = b.blog_id
          AND (filter_bt.slug = ? OR filter_bt.name = ?)
      )
    `, tag, tag);
  }

  if (params.publishedAfter?.trim()) {
    where.add(`b.published_at >= ?::timestamp`, params.publishedAfter.trim());
  }

  return where;
};

class BlogReadModel {
  async listPublishedBlogs(params: BlogListParams): Promise<{ blogs: any[]; totalCount: number }> {
    const { limit, offset } = withLimitOffset(params);
    const direction = orderDirection(params.sortOrder);
    const where = buildPublishedBlogWhere(params);

    const countResult = await databaseService.executeQuery(
      `
        SELECT COUNT(DISTINCT b.blog_id)::int AS total_count
        FROM "Blog" b
        LEFT JOIN "BlogCategory" bc ON bc.category_id = b.category_id
        WHERE ${where.toSql()};
      `,
      where.values
    );

    const values = [...where.values, limit, offset];
    const result = await databaseService.executeQuery(
      `
        SELECT ${blogSelectWithTags}
        FROM "Blog" b
        LEFT JOIN "BlogCategory" bc ON bc.category_id = b.category_id
        LEFT JOIN "User" u ON u.user_id = b.author_id
        LEFT JOIN "BlogTagMap" btm ON btm.blog_id = b.blog_id
        LEFT JOIN "BlogTag" bt ON bt.tag_id = btm.tag_id
        WHERE ${where.toSql()}
        GROUP BY b.blog_id, bc.category_id, u.username
        ORDER BY b.published_at ${direction}, b.blog_id ${direction}
        LIMIT $${values.length - 1} OFFSET $${values.length};
      `,
      values
    );

    return {
      blogs: result.rows,
      totalCount: Number(countResult.rows[0]?.total_count || 0),
    };
  }

  async getPublishedBlog(identifier: string) {
    const isNumericId = /^\d+$/.test(identifier);
    const result = await databaseService.executeQuery(
      `
        SELECT ${blogSelectWithTags}
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
}

export default new BlogReadModel();
