import assert from "node:assert/strict";
import { after } from "node:test";
import pool from "../../config/database.js";
import databaseService from "../../services/database.service.js";
import adminBlogsModel from "../admin/blogs.model.js";
import { assertIntegrationDatabaseAllowed, integrationTest, runIntegrationTests } from "../integrationTest.helpers.js";

assertIntegrationDatabaseAllowed();

const testRunId = `abit_${Math.floor(Math.random() * 100000).toString(36)}`;
const createdUserIds: number[] = [];
const createdBlogIds: number[] = [];

const createOwner = async (suffix: string) => {
  const result = await databaseService.executeQuery(
    `
      INSERT INTO "User" (username, email, password_hash, role, status, created_at, updated_at)
      VALUES ($1, $2, 'integration-test-password-hash', 'owner', 'active', NOW(), NOW())
      RETURNING user_id;
    `,
    [`${testRunId}_${suffix}`, `${testRunId}_${suffix}@example.test`]
  );
  const user = result.rows[0];
  createdUserIds.push(user.user_id);
  return user;
};

const createBlog = async (authorId: number, suffix: string) => {
  const blog = await adminBlogsModel.createBlog({
    title: `${testRunId}_${suffix}`,
    slug: `${testRunId}-${suffix}`,
    excerpt: "Integration blog excerpt",
    content: "Integration blog content",
    category_name: null,
    tags: [],
    cover_asset_id: null,
    image_url: null,
    video_asset_id: null,
    video_url: null,
    status: "draft",
    author_id: authorId,
  });
  createdBlogIds.push(blog.blog_id);
  return blog;
};

after(async () => {
  if (runIntegrationTests) {
    await databaseService.executeQuery(`DELETE FROM "BlogTagMap" WHERE blog_id = ANY($1::int[])`, [createdBlogIds]);
    await databaseService.executeQuery(`DELETE FROM "Blog" WHERE blog_id = ANY($1::int[])`, [createdBlogIds]);
    await databaseService.executeQuery(`DELETE FROM "User" WHERE user_id = ANY($1::int[])`, [createdUserIds]);
  }

  await pool.end();
});

integrationTest("owner cannot update another author's blog", async () => {
  const owner = await createOwner("blog_owner_a");
  const otherOwner = await createOwner("blog_owner_b");
  const blog = await createBlog(otherOwner.user_id, "owned_blog");

  const updated = await adminBlogsModel.updateBlog(blog.blog_id, { title: "blocked blog update" }, owner.user_id);

  assert.equal(updated, null);

  const stateResult = await databaseService.executeQuery(`SELECT title FROM "Blog" WHERE blog_id = $1;`, [blog.blog_id]);
  assert.notEqual(stateResult.rows[0].title, "blocked blog update");
});

integrationTest("owner can publish blog update without SQL parameter type conflict", async () => {
  const owner = await createOwner("blog_publish_owner");
  const blog = await createBlog(owner.user_id, "publish_blog");

  const updated = await adminBlogsModel.updateBlog(blog.blog_id, {
    title: "Published integration blog",
    slug: "published-integration-blog",
    excerpt: "Updated excerpt",
    content: "Updated content",
    cover_asset_id: null,
    image_url: null,
    video_asset_id: null,
    video_url: null,
    status: "published",
  }, owner.user_id);

  assert.equal(updated?.status, "published");

  const stateResult = await databaseService.executeQuery(
    `SELECT status, published_at FROM "Blog" WHERE blog_id = $1;`,
    [blog.blog_id]
  );
  assert.equal(stateResult.rows[0].status, "published");
  assert.notEqual(stateResult.rows[0].published_at, null);
});

integrationTest("owner cannot delete another author's blog", async () => {
  const owner = await createOwner("blog_delete_owner_a");
  const otherOwner = await createOwner("blog_delete_owner_b");
  const blog = await createBlog(otherOwner.user_id, "delete_owned_blog");

  const deleted = await adminBlogsModel.deleteBlog(blog.blog_id, owner.user_id);

  assert.equal(deleted, false);

  const stateResult = await databaseService.executeQuery(`SELECT deleted_at FROM "Blog" WHERE blog_id = $1;`, [blog.blog_id]);
  assert.equal(stateResult.rows[0].deleted_at, null);
});
