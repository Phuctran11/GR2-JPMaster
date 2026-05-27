import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import adminJlptService from "../../services/admin/jlpt.service.js";
import { ownerScope } from "../../utils/adminContext.js";
import { created, message, ok, paginated, requireUser } from "../../utils/http.js";
import { parsePositiveInt } from "../../validators/common.validator.js";

export class AdminJlptController {
  async listJlptExams(req: Request, res: Response) {
    const { data, totalCount } = await adminJlptService.listJlptExams(req.query, ownerScope(req));
    return paginated(res, data, totalCount);
  }

  async createJlptExam(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);
    const data = await adminJlptService.createJlptExam(req.body, user.user_id);
    return created(res, "JLPT test created successfully", data);
  }

  async updateJlptExam(req: Request, res: Response) {
    const examId = parsePositiveInt(req.params.examId, "JLPT test ID");
    const data = await adminJlptService.updateJlptExam(examId, req.body, ownerScope(req));
    return ok(res, data, { message: "JLPT test updated successfully" });
  }

  async deleteJlptExam(req: Request, res: Response) {
    const examId = parsePositiveInt(req.params.examId, "JLPT test ID");
    await adminJlptService.deleteJlptExam(examId, ownerScope(req));
    return message(res, "JLPT test hidden successfully");
  }

  async listReadingPassages(req: Request, res: Response) {
    const data = await adminJlptService.listReadingPassages(req.query, ownerScope(req));
    return paginated(res, data);
  }

  async createReadingPassage(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);
    const data = await adminJlptService.createReadingPassage(req.body, user.user_id);
    return created(res, "Reading passage created successfully", data);
  }

  async updateReadingPassage(req: Request, res: Response) {
    const passageId = parsePositiveInt(req.params.passageId, "reading passage ID");
    const data = await adminJlptService.updateReadingPassage(passageId, req.body, ownerScope(req));
    return ok(res, data, { message: "Reading passage updated successfully" });
  }

  async deleteReadingPassage(req: Request, res: Response) {
    const passageId = parsePositiveInt(req.params.passageId, "reading passage ID");
    await adminJlptService.deleteReadingPassage(passageId, ownerScope(req));
    return message(res, "Reading passage hidden successfully");
  }

  async listJlptSections(req: Request, res: Response) {
    const examId = parsePositiveInt(req.params.examId, "JLPT test ID");
    const data = await adminJlptService.listJlptSections(examId, ownerScope(req));
    return paginated(res, data);
  }

  async createJlptSection(req: Request, res: Response) {
    const examId = parsePositiveInt(req.params.examId, "JLPT test ID");
    const data = await adminJlptService.createJlptSection(examId, req.body, ownerScope(req));
    return created(res, "JLPT section created successfully", data);
  }

  async updateJlptSection(req: Request, res: Response) {
    const sectionId = parsePositiveInt(req.params.sectionId, "JLPT section ID");
    const data = await adminJlptService.updateJlptSection(sectionId, req.body, ownerScope(req));
    return ok(res, data, { message: "JLPT section updated successfully" });
  }

  async deleteJlptSection(req: Request, res: Response) {
    const sectionId = parsePositiveInt(req.params.sectionId, "JLPT section ID");
    await adminJlptService.deleteJlptSection(sectionId, ownerScope(req));
    return message(res, "JLPT section hidden successfully");
  }

  async listJlptSectionQuestions(req: Request, res: Response) {
    const sectionId = parsePositiveInt(req.params.sectionId, "JLPT section ID");
    const data = await adminJlptService.listJlptSectionQuestions(sectionId, ownerScope(req));
    return paginated(res, data);
  }

  async createJlptSectionQuestion(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);
    const sectionId = parsePositiveInt(req.params.sectionId, "JLPT section ID");
    const data = await adminJlptService.createJlptSectionQuestion(sectionId, req.body, user.user_id, ownerScope(req));
    return created(res, "JLPT question created successfully", data);
  }

  async autoAddJlptSectionQuestions(req: Request, res: Response) {
    const sectionId = parsePositiveInt(req.params.sectionId, "JLPT section ID");
    const result = await adminJlptService.autoAddJlptSectionQuestions(sectionId, req.body, ownerScope(req));

    if (result.status === "not_found") return res.status(404).json({ error: "JLPT section not found" });
    if (result.status === "unsupported_section") return res.status(400).json({ error: "Auto generation only supports vocabulary and grammar sections" });
    if (result.status === "invalid") return res.status(400).json({ error: result.error });
    if (result.status === "insufficient") {
      return res.status(409).json({
        error: "Not enough matching questions in the question bank",
        shortages: result.shortages,
      });
    }

    return res.status(201).json({
      message: `${result.added_count} questions added successfully`,
      data: result.questions,
      added_count: result.added_count,
      requested_count: result.requested_count,
    });
  }

  async updateJlptSectionQuestion(req: Request, res: Response) {
    const sectionId = parsePositiveInt(req.params.sectionId, "JLPT section ID");
    const questionId = parsePositiveInt(req.params.questionId, "question ID");
    const data = await adminJlptService.updateJlptSectionQuestion(sectionId, questionId, req.body, ownerScope(req));
    return ok(res, data, { message: "JLPT question updated successfully" });
  }

  async updateJlptSectionQuestionOrder(req: Request, res: Response) {
    const sectionId = parsePositiveInt(req.params.sectionId, "JLPT section ID");
    const questionId = parsePositiveInt(req.params.questionId, "question ID");
    await adminJlptService.updateJlptSectionQuestionOrder(sectionId, questionId, req.body.order_index, ownerScope(req));
    return message(res, "JLPT question order updated successfully");
  }

  async deleteJlptSectionQuestion(req: Request, res: Response) {
    const sectionId = parsePositiveInt(req.params.sectionId, "JLPT section ID");
    const questionId = parsePositiveInt(req.params.questionId, "question ID");
    await adminJlptService.deleteJlptSectionQuestion(sectionId, questionId, ownerScope(req));
    return message(res, "JLPT question hidden successfully");
  }
}

export default new AdminJlptController();
