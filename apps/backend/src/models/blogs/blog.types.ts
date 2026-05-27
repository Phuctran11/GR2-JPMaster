import type { SortOrder } from "../admin.model.js";

export interface BlogListParams {
  limit?: number;
  offset?: number;
  search?: string;
  category?: string;
  tag?: string;
  publishedAfter?: string;
  sortOrder?: SortOrder;
}

export const blogSelectWithTags = `
  b.blog_id, b.title, b.slug, b.excerpt, b.content, b.category_id,
  bc.name AS category, bc.slug AS category_slug,
  b.cover_asset_id, b.image_url, b.video_asset_id, b.video_url, b.status, b.author_id, u.username AS author_username,
  b.published_at, b.created_at, b.updated_at,
  COALESCE(
    json_agg(json_build_object('tag_id', bt.tag_id, 'name', bt.name, 'slug', bt.slug, 'tag_type', bt.tag_type) ORDER BY bt.name)
    FILTER (WHERE bt.tag_id IS NOT NULL),
    '[]'::json
  ) AS tags
`;
