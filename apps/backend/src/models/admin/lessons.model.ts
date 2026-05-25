import adminLessonsDeleteModel from "./lessons.delete.model.js";
import adminLessonsReadModel from "./lessons.read.model.js";
import adminLessonsWriteModel from "./lessons.write.model.js";

export class AdminLessonsModel {
  listLessons = adminLessonsReadModel.listLessons.bind(adminLessonsReadModel);
  createLesson = adminLessonsWriteModel.createLesson.bind(adminLessonsWriteModel);
  updateLesson = adminLessonsWriteModel.updateLesson.bind(adminLessonsWriteModel);
  deleteLesson = adminLessonsDeleteModel.deleteLesson.bind(adminLessonsDeleteModel);
}

export default new AdminLessonsModel();
