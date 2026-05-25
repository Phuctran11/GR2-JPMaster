import adminQuizzesReadModel from "./quizzes.read.model.js";
import adminQuizzesWriteModel from "./quizzes.write.model.js";

class AdminQuizzesModel {
  listQuizzes = adminQuizzesReadModel.listQuizzes.bind(adminQuizzesReadModel);
  countQuizzes = adminQuizzesReadModel.countQuizzes.bind(adminQuizzesReadModel);

  createQuiz = adminQuizzesWriteModel.createQuiz.bind(adminQuizzesWriteModel);
  updateQuiz = adminQuizzesWriteModel.updateQuiz.bind(adminQuizzesWriteModel);
  deleteQuiz = adminQuizzesWriteModel.deleteQuiz.bind(adminQuizzesWriteModel);
}

export default new AdminQuizzesModel();
