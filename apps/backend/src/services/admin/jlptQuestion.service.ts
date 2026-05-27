import adminJlptModel from "../../models/admin/jlpt.model.js";
import { ApiError } from "../../utils/http.js";
import { type BodyInput, toNumberOrNull } from "../../validators/admin/common.validator.js";
import { parseAutoJlptQuestionsPayload } from "../../validators/admin/jlpt.validator.js";
import { parseQuestionPayload } from "../../validators/admin/question.validator.js";

class AdminJlptQuestionService {
  async listJlptSectionQuestions(sectionId: number, ownerId?: number) {
    return adminJlptModel.listJlptSectionQuestions(sectionId, ownerId);
  }

  async createJlptSectionQuestion(sectionId: number, body: BodyInput, userId: number, ownerId?: number) {
    const parsed = parseQuestionPayload(body);
    if ("error" in parsed) {
      throw new ApiError(400, parsed.error);
    }

    const data = await adminJlptModel.createJlptSectionQuestion(sectionId, parsed.data, userId, ownerId);
    if (!data) {
      throw new ApiError(404, "JLPT section not found");
    }

    return data;
  }

  async autoAddJlptSectionQuestions(sectionId: number, body: BodyInput, ownerId?: number) {
    const parsed = parseAutoJlptQuestionsPayload(body);
    if ("error" in parsed) {
      throw new ApiError(400, parsed.error);
    }

    return adminJlptModel.autoAddJlptSectionQuestions(sectionId, parsed, ownerId);
  }

  async updateJlptSectionQuestion(sectionId: number, questionId: number, body: BodyInput, ownerId?: number) {
    const parsed = parseQuestionPayload(body);
    if ("error" in parsed) {
      throw new ApiError(400, parsed.error);
    }

    const data = await adminJlptModel.updateJlptSectionQuestion(sectionId, questionId, parsed.data, ownerId);
    if (!data) {
      throw new ApiError(404, "JLPT question not found");
    }

    return data;
  }

  async updateJlptSectionQuestionOrder(sectionId: number, questionId: number, orderIndex: unknown, ownerId?: number) {
    const updated = await adminJlptModel.updateJlptSectionQuestionOrder(
      sectionId,
      questionId,
      toNumberOrNull(orderIndex),
      ownerId
    );
    if (!updated) {
      throw new ApiError(404, "JLPT question not found");
    }
  }

  async deleteJlptSectionQuestion(sectionId: number, questionId: number, ownerId?: number) {
    const deleted = await adminJlptModel.deleteJlptSectionQuestion(sectionId, questionId, ownerId);
    if (!deleted) {
      throw new ApiError(404, "JLPT question not found");
    }
  }
}

export default new AdminJlptQuestionService();
