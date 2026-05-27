import type { PoolClient } from "pg";
import type { AdminListParams } from "../admin.model.js";
import { WhereBuilder } from "../sqlHelpers.js";

export const isUndefined = (value: unknown) => value === undefined;

export const buildBlogWhere = (params: AdminListParams) => {
  const where = new WhereBuilder([`b.deleted_at IS NULL`]);

  if (params.search?.trim()) {
    const search = `%${params.search.trim()}%`;
    where.add(`(b.title ILIKE ? OR b.excerpt ILIKE ? OR bc.name ILIKE ?)`, search, search, search);
  }

  where
    .addIf(Boolean(params.status && params.status !== "all"), `b.status = ?`, params.status)
    .addIf(Boolean(params.ownerId), `b.author_id = ?`, params.ownerId);

  return { values: where.values, whereSql: where.toSql() };
};

export const blogSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const ensureBlogCategory = async (client: PoolClient, categoryName: string | null | undefined) => {
  const name = categoryName?.trim();
  if (!name) return null;

  const slug = blogSlug(name);
  const result = await client.query(
    `
      INSERT INTO "BlogCategory" (name, slug, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      ON CONFLICT (name) DO UPDATE
      SET updated_at = "BlogCategory".updated_at
      RETURNING category_id;
    `,
    [name, slug]
  );
  return result.rows[0]?.category_id ?? null;
};

export const replaceBlogTags = async (client: PoolClient, blogId: number, tags: string[] | undefined) => {
  if (tags === undefined) return;

  await client.query(`DELETE FROM "BlogTagMap" WHERE blog_id = $1;`, [blogId]);

  const normalizedTags = [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
  for (const tag of normalizedTags) {
    const slug = blogSlug(tag);
    const tagType = ["vocabulary", "grammar", "reading", "listening"].includes(slug)
      ? "skill"
      : /^n[1-5]$/.test(slug)
        ? "jlpt_level"
        : "topic";
    const tagResult = await client.query(
      `
        INSERT INTO "BlogTag" (name, slug, tag_type, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (name) DO UPDATE
        SET updated_at = "BlogTag".updated_at
        RETURNING tag_id;
      `,
      [tag, slug.toUpperCase().startsWith("N") ? slug.toUpperCase() : slug, tagType]
    );
    await client.query(
      `
        INSERT INTO "BlogTagMap" (blog_id, tag_id, created_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (blog_id, tag_id) DO NOTHING;
      `,
      [blogId, tagResult.rows[0].tag_id]
    );
  }
};
