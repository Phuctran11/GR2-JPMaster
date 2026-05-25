import quizQuestionsModel from "./quizQuestions.model.js";
import quizzesModel from "./quizzes.model.js";

const adminTestsModel = {
  listQuizzes: quizzesModel.listQuizzes.bind(quizzesModel),
  countQuizzes: quizzesModel.countQuizzes.bind(quizzesModel),
  createQuiz: quizzesModel.createQuiz.bind(quizzesModel),
  updateQuiz: quizzesModel.updateQuiz.bind(quizzesModel),
  deleteQuiz: quizzesModel.deleteQuiz.bind(quizzesModel),

  listQuizQuestions: quizQuestionsModel.listQuizQuestions.bind(quizQuestionsModel),
  createQuizQuestion: quizQuestionsModel.createQuizQuestion.bind(quizQuestionsModel),
  updateQuizQuestion: quizQuestionsModel.updateQuizQuestion.bind(quizQuestionsModel),
  updateQuizQuestionOrder: quizQuestionsModel.updateQuizQuestionOrder.bind(quizQuestionsModel),
  deleteQuizQuestion: quizQuestionsModel.deleteQuizQuestion.bind(quizQuestionsModel),
};

export default adminTestsModel;
