import jlptExamReadModel from "./jlptExam.read.model.js";
import jlptExamSubmitModel from "./jlptExam.submit.model.js";
import type { JlptAnswerPayload } from "./jlptExam.types.js";

export type { JlptAnswerPayload };

export class JlptExamModel {
  listExams = jlptExamReadModel.listExams.bind(jlptExamReadModel);
  getExamById = jlptExamReadModel.getExamById.bind(jlptExamReadModel);
  submitExam = jlptExamSubmitModel.submitExam.bind(jlptExamSubmitModel);
}

export default new JlptExamModel();

