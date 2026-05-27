import quizDetailModel from "./quiz.detail.model.js";
import quizLookupModel from "./quiz.lookup.model.js";
import quizStateModel from "./quiz.state.model.js";

export class QuizReadModel {
  getQuizAttemptState = quizStateModel.getQuizAttemptState.bind(quizStateModel);
  hasPassedQuiz = quizStateModel.hasPassedQuiz.bind(quizStateModel);
  hasPassedLessonQuiz = quizStateModel.hasPassedLessonQuiz.bind(quizStateModel);
  hasPassedFinalQuiz = quizStateModel.hasPassedFinalQuiz.bind(quizStateModel);

  getQuizByIdInternal = quizDetailModel.getQuizByIdInternal.bind(quizDetailModel);
  getPublicQuizById = quizDetailModel.getPublicQuizById.bind(quizDetailModel);

  getQuizCourseId = quizLookupModel.getQuizCourseId.bind(quizLookupModel);
  getLessonCourseId = quizLookupModel.getLessonCourseId.bind(quizLookupModel);
  getLessonQuiz = quizLookupModel.getLessonQuiz.bind(quizLookupModel);
  getFinalQuiz = quizLookupModel.getFinalQuiz.bind(quizLookupModel);
}

export default new QuizReadModel();
