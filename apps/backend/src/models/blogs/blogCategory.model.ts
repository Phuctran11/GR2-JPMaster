import databaseService from "../../services/database.service.js";

class BlogCategoryModel {
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

export default new BlogCategoryModel();
