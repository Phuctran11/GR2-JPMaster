import adminJlptQuestionsAutoModel from "./jlptQuestions.auto.model.js";
import adminJlptQuestionsReadModel from "./jlptQuestions.read.model.js";
import adminJlptQuestionsWriteModel from "./jlptQuestions.write.model.js";

class AdminJlptQuestionsModel {
  listJlptSectionQuestions = adminJlptQuestionsReadModel.listJlptSectionQuestions.bind(adminJlptQuestionsReadModel);

  createJlptSectionQuestion = adminJlptQuestionsWriteModel.createJlptSectionQuestion.bind(adminJlptQuestionsWriteModel);
  updateJlptSectionQuestion = adminJlptQuestionsWriteModel.updateJlptSectionQuestion.bind(adminJlptQuestionsWriteModel);
  updateJlptSectionQuestionOrder = adminJlptQuestionsWriteModel.updateJlptSectionQuestionOrder.bind(adminJlptQuestionsWriteModel);
  deleteJlptSectionQuestion = adminJlptQuestionsWriteModel.deleteJlptSectionQuestion.bind(adminJlptQuestionsWriteModel);

  autoAddJlptSectionQuestions = adminJlptQuestionsAutoModel.autoAddJlptSectionQuestions.bind(adminJlptQuestionsAutoModel);
}

export default new AdminJlptQuestionsModel();
