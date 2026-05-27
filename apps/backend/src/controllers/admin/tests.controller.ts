import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import adminTestsService from "../../services/admin/tests.service.js";
import { ownerScope } from "../../utils/adminContext.js";
import { created, message, ok, paginated, requireUser } from "../../utils/http.js";
import { parsePositiveInt } from "../../validators/common.validator.js";

export class AdminTestsController {
  async listQuizzes(req: Request, res: Response) {
    const { data, totalCount } = await adminTestsService.listQuizzes(req.query, ownerScope(req));
    return paginated(res, data, totalCount);
  }

  async createQuiz(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);
    const data = await adminTestsService.createQuiz(req.body, { userId: user.user_id, role: user.role }, ownerScope(req));
    return created(res, "Test created successfully", data);
  }

  async updateQuiz(req: Request, res: Response) {
    const quizId = parsePositiveInt(req.params.id, "quiz ID");
    const data = await adminTestsService.updateQuiz(quizId, req.body, ownerScope(req));
    return ok(res, data, { message: "Test updated successfully" });
  }

  async deleteQuiz(req: Request, res: Response) {
    const quizId = parsePositiveInt(req.params.id, "quiz ID");
    await adminTestsService.deleteQuiz(quizId, ownerScope(req));
    return message(res, "Test hidden successfully");
  }

  async listQuizQuestions(req: Request, res: Response) {
    const quizId = parsePositiveInt(req.params.id, "quiz ID");
    const data = await adminTestsService.listQuizQuestions(quizId, ownerScope(req));
    return paginated(res, data);
  }

  async createQuizQuestion(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);
    const quizId = parsePositiveInt(req.params.id, "quiz ID");
    const data = await adminTestsService.createQuizQuestion(quizId, req.body, user.user_id, ownerScope(req));
    return created(res, "Question created successfully", data);
  }

  async updateQuizQuestion(req: Request, res: Response) {
    const quizId = parsePositiveInt(req.params.quizId, "quiz ID");
    const questionId = parsePositiveInt(req.params.questionId, "question ID");
    const data = await adminTestsService.updateQuizQuestion(quizId, questionId, req.body, ownerScope(req));
    return ok(res, data, { message: "Question updated successfully" });
  }

  async deleteQuizQuestion(req: Request, res: Response) {
    const quizId = parsePositiveInt(req.params.quizId, "quiz ID");
    const questionId = parsePositiveInt(req.params.questionId, "question ID");
    await adminTestsService.deleteQuizQuestion(quizId, questionId, ownerScope(req));
    return message(res, "Question hidden successfully");
  }

  async updateQuizQuestionOrder(req: Request, res: Response) {
    const quizId = parsePositiveInt(req.params.quizId, "quiz ID");
    const questionId = parsePositiveInt(req.params.questionId, "question ID");
    await adminTestsService.updateQuizQuestionOrder(quizId, questionId, req.body.order_index, ownerScope(req));
    return message(res, "Question order updated successfully");
  }
}

export default new AdminTestsController();
