import adminBlogsReadModel from "./blogs.read.model.js";
import adminBlogsWriteModel from "./blogs.write.model.js";

class AdminBlogsModel {
  listBlogs = adminBlogsReadModel.listBlogs.bind(adminBlogsReadModel);
  countBlogs = adminBlogsReadModel.countBlogs.bind(adminBlogsReadModel);

  createBlog = adminBlogsWriteModel.createBlog.bind(adminBlogsWriteModel);
  updateBlog = adminBlogsWriteModel.updateBlog.bind(adminBlogsWriteModel);
  deleteBlog = adminBlogsWriteModel.deleteBlog.bind(adminBlogsWriteModel);
}

export default new AdminBlogsModel();
