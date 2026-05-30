import adminCoursesController from "./courses.controller.js";
import adminJlptController from "./jlpt.controller.js";
import adminLessonsController from "./lessons.controller.js";
import adminStatsController from "./stats.controller.js";
import adminTestsController from "./tests.controller.js";
import adminUsersController from "./users.controller.js";

export const adminController = {
  getStats: adminStatsController.getStats.bind(adminStatsController),
  listUsers: adminUsersController.listUsers.bind(adminUsersController),
  createUser: adminUsersController.createUser.bind(adminUsersController),
  updateUser: adminUsersController.updateUser.bind(adminUsersController),
  deleteUser: adminUsersController.deleteUser.bind(adminUsersController),
  listCourses: adminCoursesController.listCourses.bind(adminCoursesController),
  createCourse: adminCoursesController.createCourse.bind(adminCoursesController),
  updateCourse: adminCoursesController.updateCourse.bind(adminCoursesController),
  deleteCourse: adminCoursesController.deleteCourse.bind(adminCoursesController),
  listLessons: adminLessonsController.listLessons.bind(adminLessonsController),
  createLesson: adminLessonsController.createLesson.bind(adminLessonsController),
  updateLesson: adminLessonsController.updateLesson.bind(adminLessonsController),
  deleteLesson: adminLessonsController.deleteLesson.bind(adminLessonsController),
  listQuizzes: adminTestsController.listQuizzes.bind(adminTestsController),
  createQuiz: adminTestsController.createQuiz.bind(adminTestsController),
  updateQuiz: adminTestsController.updateQuiz.bind(adminTestsController),
  deleteQuiz: adminTestsController.deleteQuiz.bind(adminTestsController),
  listQuizQuestions: adminTestsController.listQuizQuestions.bind(adminTestsController),
  createQuizQuestion: adminTestsController.createQuizQuestion.bind(adminTestsController),
  updateQuizQuestion: adminTestsController.updateQuizQuestion.bind(adminTestsController),
  deleteQuizQuestion: adminTestsController.deleteQuizQuestion.bind(adminTestsController),
  updateQuizQuestionOrder: adminTestsController.updateQuizQuestionOrder.bind(adminTestsController),
  listJlptExams: adminJlptController.listJlptExams.bind(adminJlptController),
  createJlptExam: adminJlptController.createJlptExam.bind(adminJlptController),
  updateJlptExam: adminJlptController.updateJlptExam.bind(adminJlptController),
  deleteJlptExam: adminJlptController.deleteJlptExam.bind(adminJlptController),
  listReadingPassages: adminJlptController.listReadingPassages.bind(adminJlptController),
  createReadingPassage: adminJlptController.createReadingPassage.bind(adminJlptController),
  updateReadingPassage: adminJlptController.updateReadingPassage.bind(adminJlptController),
  deleteReadingPassage: adminJlptController.deleteReadingPassage.bind(adminJlptController),
  listJlptSections: adminJlptController.listJlptSections.bind(adminJlptController),
  createJlptSection: adminJlptController.createJlptSection.bind(adminJlptController),
  updateJlptSection: adminJlptController.updateJlptSection.bind(adminJlptController),
  deleteJlptSection: adminJlptController.deleteJlptSection.bind(adminJlptController),
  listJlptSectionQuestions: adminJlptController.listJlptSectionQuestions.bind(adminJlptController),
  createJlptSectionQuestion: adminJlptController.createJlptSectionQuestion.bind(adminJlptController),
  autoAddJlptSectionQuestions: adminJlptController.autoAddJlptSectionQuestions.bind(adminJlptController),
  updateJlptSectionQuestion: adminJlptController.updateJlptSectionQuestion.bind(adminJlptController),
  updateJlptSectionQuestionOrder: adminJlptController.updateJlptSectionQuestionOrder.bind(adminJlptController),
  deleteJlptSectionQuestion: adminJlptController.deleteJlptSectionQuestion.bind(adminJlptController),
};

export default adminController;
