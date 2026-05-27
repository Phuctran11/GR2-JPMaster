import courseDetailModel from "./course.detail.model.js";
import courseListModel from "./course.list.model.js";

export class CourseReadModel {
  getCourseById = courseDetailModel.getCourseById.bind(courseDetailModel);
  getCourseByIdWithLessons = courseDetailModel.getCourseByIdWithLessons.bind(courseDetailModel);
  getCourseByIdWithDetail = courseDetailModel.getCourseByIdWithDetail.bind(courseDetailModel);

  getCoursesWithLessons = courseListModel.getCoursesWithLessons.bind(courseListModel);
  getCoursesWithLessonsByIds = courseListModel.getCoursesWithLessonsByIds.bind(courseListModel);
  getAllCourses = courseListModel.getAllCourses.bind(courseListModel);
  getExploreCourses = courseListModel.getExploreCourses.bind(courseListModel);
  getPopularCourses = courseListModel.getPopularCourses.bind(courseListModel);
  getCoursesByCreator = courseListModel.getCoursesByCreator.bind(courseListModel);
}

export default new CourseReadModel();
