import jlptExamModel, { JlptAnswerPayload } from "../../models/jlpt/jlptExam.model.js";
import { ApiError } from "../../utils/http.js";
import learningActivityService from "../achievements/learningActivity.service.js";

const validLevels = ["N1", "N2", "N3", "N4", "N5", "All"];
const validSections = ["all", "vocabulary", "grammar", "reading", "listening"];

export class JlptExamService {
  async listExams(query: { level?: unknown; section_type?: unknown; limit?: unknown; offset?: unknown }) {
    const level = String(query.level || "All");
    const sectionType = String(query.section_type || "all");

    return jlptExamModel.listExams({
      level: validLevels.includes(level) ? level : "All",
      section_type: validSections.includes(sectionType) ? sectionType : "all",
      limit: Number(query.limit),
      offset: Number(query.offset),
    });
  }

  async getExam(examId: number) {
    const exam = await jlptExamModel.getExamById(examId);
    if (!exam) {
      throw new ApiError(404, "JLPT exam not found");
    }
    return exam;
  }

  async submitExam(userId: number, examId: number, answers: JlptAnswerPayload[]) {
    const result = await jlptExamModel.submitExam(userId, examId, answers);
    if (!result) {
      throw new ApiError(404, "JLPT exam not found");
    }

    await learningActivityService.recordJlptSubmitted(userId, examId, result.score);
    return result;
  }
}

export default new JlptExamService();
