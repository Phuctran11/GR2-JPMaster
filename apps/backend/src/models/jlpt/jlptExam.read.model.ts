import jlptExamDetailModel from "./jlptExam.detail.model.js";
import jlptExamListModel from "./jlptExam.list.model.js";

export class JlptExamReadModel {
  listExams = jlptExamListModel.listExams.bind(jlptExamListModel);
  getExamById = jlptExamDetailModel.getExamById.bind(jlptExamDetailModel);
}

export default new JlptExamReadModel();
