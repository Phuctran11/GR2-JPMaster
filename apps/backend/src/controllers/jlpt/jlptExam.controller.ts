import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import jlptExamService from "../../services/jlpt/jlptExam.service.js";
import { ApiError, created, ok, paginated, requireUser } from "../../utils/http.js";
import { parsePositiveInt } from "../../validators/common.validator.js";

export class JlptExamController {
  async listExams(req: Request, res: Response) {
    const result = await jlptExamService.listExams(req.query);
    return paginated(res, result.data, result.totalCount);
  }

  async getExam(req: Request, res: Response) {
    const examId = parsePositiveInt(req.params.examId, "JLPT exam ID");

    const data = await jlptExamService.getExam(examId);
    return ok(res, data);
  }

  async submitExam(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);

    const examId = parsePositiveInt(req.params.examId, "JLPT exam ID");
    if (!Array.isArray(req.body.answers)) throw new ApiError(400, "answers must be an array");

    const data = await jlptExamService.submitExam(user.user_id, examId, req.body.answers);
    return created(res, data.passed ? "JLPT test passed" : "JLPT test submitted", data);
  }
}

export default new JlptExamController();
