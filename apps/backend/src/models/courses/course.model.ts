import courseLessonModel from "./course.lesson.model.js";
import courseProgressModel from "./course.progress.model.js";
import courseReadModel from "./course.read.model.js";
import type {
  Course,
  CourseDetail,
  CourseRatingInfo,
  CourseWithLessons,
  Lesson,
} from "./course.types.js";
import courseWriteModel from "./course.write.model.js";

export type { Course, CourseDetail, CourseRatingInfo, CourseWithLessons, Lesson };

export class CourseModel {
  createCourse = courseWriteModel.createCourse.bind(courseWriteModel);
  updateCourse = courseWriteModel.updateCourse.bind(courseWriteModel);
  deleteCourse = courseWriteModel.deleteCourse.bind(courseWriteModel);

  getCourseById = courseReadModel.getCourseById.bind(courseReadModel);
  getCourseByIdWithLessons = courseReadModel.getCourseByIdWithLessons.bind(courseReadModel);
  getCoursesWithLessons = courseReadModel.getCoursesWithLessons.bind(courseReadModel);
  getCoursesWithLessonsByIds = courseReadModel.getCoursesWithLessonsByIds.bind(courseReadModel);
  getCourseByIdWithDetail = courseReadModel.getCourseByIdWithDetail.bind(courseReadModel);
  getAllCourses = courseReadModel.getAllCourses.bind(courseReadModel);
  getExploreCourses = courseReadModel.getExploreCourses.bind(courseReadModel);
  getPopularCourses = courseReadModel.getPopularCourses.bind(courseReadModel);
  getCoursesByCreator = courseReadModel.getCoursesByCreator.bind(courseReadModel);

  getLessonCompletionMap = courseProgressModel.getLessonCompletionMap.bind(courseProgressModel);
  getNextUnfinishedLessonByUserAndCourse = courseProgressModel.getNextUnfinishedLessonByUserAndCourse.bind(courseProgressModel);
  getCourseProgressSummary = courseProgressModel.getCourseProgressSummary.bind(courseProgressModel);
  getCourseProgressSummaries = courseProgressModel.getCourseProgressSummaries.bind(courseProgressModel);

  getFirstLessonByCourseId = courseLessonModel.getFirstLessonByCourseId.bind(courseLessonModel);
  getLessonByCourseAndLessonId = courseLessonModel.getLessonByCourseAndLessonId.bind(courseLessonModel);
}

export default new CourseModel();

