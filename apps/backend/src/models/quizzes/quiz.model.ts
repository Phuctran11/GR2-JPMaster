import quizAttemptModel from "./quiz.attempt.model.js";
import quizReadModel from "./quiz.read.model.js";
import quizSubmitModel from "./quiz.submit.model.js";
import type {
  QuestionType,
  QuizAnswerInput,
  QuizAttemptSummary,
  QuizDetail,
  QuizOption,
  QuizQuestion,
} from "./quiz.types.js";

export type {
  QuestionType,
  QuizAnswerInput,
  QuizAttemptSummary,
  QuizDetail,
  QuizOption,
  QuizQuestion,
};

export class QuizModel {
  getPublicQuizById = quizReadModel.getPublicQuizById.bind(quizReadModel);
  getQuizCourseId = quizReadModel.getQuizCourseId.bind(quizReadModel);
  getLessonCourseId = quizReadModel.getLessonCourseId.bind(quizReadModel);
  getLessonQuiz = quizReadModel.getLessonQuiz.bind(quizReadModel);
  getFinalQuiz = quizReadModel.getFinalQuiz.bind(quizReadModel);
  hasPassedQuiz = quizReadModel.hasPassedQuiz.bind(quizReadModel);
  hasPassedLessonQuiz = quizReadModel.hasPassedLessonQuiz.bind(quizReadModel);
  hasPassedFinalQuiz = quizReadModel.hasPassedFinalQuiz.bind(quizReadModel);

  startQuizAttempt = quizAttemptModel.startQuizAttempt.bind(quizAttemptModel);
  submitQuiz = quizSubmitModel.submitQuiz.bind(quizSubmitModel);
}

export default new QuizModel();

