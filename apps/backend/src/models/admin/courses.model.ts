import adminCoursesDeleteModel from "./courses.delete.model.js";
import adminCoursesReadModel from "./courses.read.model.js";
import adminCoursesWriteModel from "./courses.write.model.js";

export class AdminCoursesModel {
  listCourses = adminCoursesReadModel.listCourses.bind(adminCoursesReadModel);
  countCourses = adminCoursesReadModel.countCourses.bind(adminCoursesReadModel);
  createCourse = adminCoursesWriteModel.createCourse.bind(adminCoursesWriteModel);
  updateCourse = adminCoursesWriteModel.updateCourse.bind(adminCoursesWriteModel);
  deleteCourse = adminCoursesDeleteModel.deleteCourse.bind(adminCoursesDeleteModel);
}

export default new AdminCoursesModel();
