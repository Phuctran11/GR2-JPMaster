import courseCatalogListModel from "./courseCatalog.list.model.js";
import courseCreatorModel from "./courseCreator.model.js";
import courseExploreModel from "./courseExplore.model.js";
import courseLessonsListModel from "./courseLessons.list.model.js";

export class CourseListModel {
  getCoursesWithLessons = courseLessonsListModel.getCoursesWithLessons.bind(courseLessonsListModel);
  getCoursesWithLessonsByIds = courseLessonsListModel.getCoursesWithLessonsByIds.bind(courseLessonsListModel);
  getAllCourses = courseCatalogListModel.getAllCourses.bind(courseCatalogListModel);
  getExploreCourses = courseExploreModel.getExploreCourses.bind(courseExploreModel);
  getPopularCourses = courseCatalogListModel.getPopularCourses.bind(courseCatalogListModel);
  getCoursesByCreator = courseCreatorModel.getCoursesByCreator.bind(courseCreatorModel);
}

export default new CourseListModel();
