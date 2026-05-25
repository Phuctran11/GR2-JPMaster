import jlptExamsReadModel from "./jlptExams.read.model.js";
import jlptExamsWriteModel from "./jlptExams.write.model.js";

class AdminJlptExamsModel {
  listJlptExams = jlptExamsReadModel.listJlptExams.bind(jlptExamsReadModel);
  countJlptExams = jlptExamsReadModel.countJlptExams.bind(jlptExamsReadModel);
  createJlptExam = jlptExamsWriteModel.createJlptExam.bind(jlptExamsWriteModel);
  updateJlptExam = jlptExamsWriteModel.updateJlptExam.bind(jlptExamsWriteModel);
  deleteJlptExam = jlptExamsWriteModel.deleteJlptExam.bind(jlptExamsWriteModel);
}

export default new AdminJlptExamsModel();
