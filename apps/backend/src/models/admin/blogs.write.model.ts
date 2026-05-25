import databaseService from "../../services/database.service.js";
import type { BlogStatus } from "../admin.model.js";
import { buildUpdateSet } from "./adminModelHelpers.js";
import adminBlogsReadModel from "./blogs.read.model.js";
import { ensureBlogCategory, isUndefined, replaceBlogTags } from "./blogs.helpers.js";

type CreateBlogInput = {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  category_name: string | null;
  tags?: string[];
  cover_asset_id: number | null;
  image_url: string | null;
  video_asset_id: number | null;
  video_url: string | null;
  status: BlogStatus;
  author_id: number;
};

type UpdateBlogInput = Partial<{
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  category_name: string | null;
  tags: string[];
  cover_asset_id: number | null;
  image_url: string | null;
  video_asset_id: number | null;
  video_url: string | null;
  status: BlogStatus;
}>;

class AdminBlogsWriteModel {
  async createBlog(input: CreateBlogInput) {
    const blogId = await databaseService.withTransaction(async (client) => {
      const categoryId = await ensureBlogCategory(client, input.category_name);
      const result = await client.query(
        `
          INSERT INTO "Blog" (title, slug, excerpt, content, category_id, cover_asset_id, image_url, video_asset_id, video_url, status, author_id, published_at, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CASE WHEN $12::text = 'published' THEN NOW() ELSE NULL END, NOW(), NOW())
          RETURNING blog_id;
        `,
        [
          input.title,
          input.slug,
          input.excerpt,
          input.content,
          categoryId,
          input.cover_asset_id,
          input.image_url,
          input.video_asset_id,
          input.video_url,
          input.status,
          input.author_id,
          input.status,
        ]
      );
      const createdBlogId = result.rows[0].blog_id;
      await replaceBlogTags(client, createdBlogId, input.tags);
      return createdBlogId;
    });
    return await adminBlogsReadModel.getBlogById(blogId);
  }

  async updateBlog(blogId: number, input: UpdateBlogInput, ownerId?: number) {
    const updated = await databaseService.withTransaction(async (client) => {
      const existing = await client.query(
        `SELECT blog_id FROM "Blog" WHERE blog_id = $1 AND deleted_at IS NULL ${ownerId ? "AND author_id = $2" : ""};`,
        ownerId ? [blogId, ownerId] : [blogId]
      );
      if (!existing.rowCount) {
        return false;
      }

      const fields = ["title", "slug", "excerpt", "content", "cover_asset_id", "image_url", "video_asset_id", "video_url", "status"] as const;
      const { updates, values, indexes } = buildUpdateSet(input, fields);

      if (!isUndefined(input.category_name)) {
        values.push(await ensureBlogCategory(client, input.category_name));
        updates.push(`category_id = $${values.length}`);
      }

      if (updates.length) {
        let publishStatusParam = "FALSE";
        if (indexes.status) {
          values.push(input.status);
          publishStatusParam = `$${values.length}::text = 'published'`;
        }
        values.push(blogId);
        await client.query(
          `
            UPDATE "Blog"
            SET ${updates.join(", ")},
                published_at = CASE
                  WHEN published_at IS NULL AND ${publishStatusParam} THEN NOW()
                  ELSE published_at
                END,
                updated_at = NOW()
            WHERE blog_id = $${values.length}
              AND deleted_at IS NULL;
          `,
          values
        );
      }

      await replaceBlogTags(client, blogId, input.tags);
      return true;
    });
    return updated ? await adminBlogsReadModel.getBlogById(blogId, ownerId) : null;
  }

  async deleteBlog(blogId: number, ownerId?: number): Promise<boolean> {
    const result = await databaseService.executeQuery(
      `
        UPDATE "Blog"
        SET deleted_at = COALESCE(deleted_at, NOW()),
            updated_at = NOW()
        WHERE blog_id = $1
          AND deleted_at IS NULL
          ${ownerId ? "AND author_id = $2" : ""};
      `,
      ownerId ? [blogId, ownerId] : [blogId]
    );
    return Boolean(result.rowCount);
  }
}

export default new AdminBlogsWriteModel();
