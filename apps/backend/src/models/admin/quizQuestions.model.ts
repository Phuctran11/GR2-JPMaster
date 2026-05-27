import adminQuizQuestionsReadModel from "./quizQuestions.read.model.js";
import adminQuizQuestionsWriteModel from "./quizQuestions.write.model.js";

class AdminQuizQuestionsModel {
  listQuizQuestions = adminQuizQuestionsReadModel.listQuizQuestions.bind(adminQuizQuestionsReadModel);

  createQuizQuestion = adminQuizQuestionsWriteModel.createQuizQuestion.bind(adminQuizQuestionsWriteModel);
  updateQuizQuestion = adminQuizQuestionsWriteModel.updateQuizQuestion.bind(adminQuizQuestionsWriteModel);
  updateQuizQuestionOrder = adminQuizQuestionsWriteModel.updateQuizQuestionOrder.bind(adminQuizQuestionsWriteModel);
  deleteQuizQuestion = adminQuizQuestionsWriteModel.deleteQuizQuestion.bind(adminQuizQuestionsWriteModel);
}

export default new AdminQuizQuestionsModel();
