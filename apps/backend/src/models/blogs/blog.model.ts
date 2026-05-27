import blogCategoryModel from "./blogCategory.model.js";
import blogReadModel from "./blog.read.model.js";
import type { BlogListParams } from "./blog.types.js";

export type { BlogListParams };

export class BlogModel {
  listPublishedBlogs = blogReadModel.listPublishedBlogs.bind(blogReadModel);
  getPublishedBlog = blogReadModel.getPublishedBlog.bind(blogReadModel);
  listCategories = blogCategoryModel.listCategories.bind(blogCategoryModel);
}

export default new BlogModel();
