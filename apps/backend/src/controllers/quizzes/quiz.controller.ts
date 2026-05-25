import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import quizService from "../../services/quizzes/quiz.service.js";
import { ApiError, created, ok, requireUser } from "../../utils/http.js";
import { optionalNumber, parsePositiveInt } from "../../validators/common.validator.js";

export class QuizController {
  async startQuiz(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);

    const quizId = parsePositiveInt(req.params.quizId, "quiz ID");
    const attempt = await quizService.startQuiz(user.user_id, quizId);
    return created(res, "Quiz attempt started", attempt);
  }

  async getLessonQuiz(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);

    const lessonId = parsePositiveInt(req.params.lessonId, "lesson ID");

    const quiz = await quizService.getLessonQuiz(user.user_id, lessonId);
    return ok(res, quiz);
  }

  async getFinalQuiz(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);

    const courseId = parsePositiveInt(req.params.courseId, "course ID");

    const quiz = await quizService.getFinalQuiz(user.user_id, courseId);
    return ok(res, quiz);
  }

  async submitQuiz(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);

    const quizId = parsePositiveInt(req.params.quizId, "quiz ID");
    const { answers = [], attempt_id } = req.body;

    if (!Array.isArray(answers)) {
      throw new ApiError(400, "answers must be an array");
    }

    const result = await quizService.submitQuiz(
      user.user_id,
      quizId,
      answers,
      optionalNumber(attempt_id) ?? undefined
    );

    return created(res, result.passed ? "Quiz passed" : "Quiz submitted", result);
  }
}

export default new QuizController();
