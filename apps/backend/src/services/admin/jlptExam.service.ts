import { JLPT_LEVELS } from "../../constants/admin.constants.js";
import type { JlptLevel } from "../../models/admin.model.js";
import adminJlptModel from "../../models/admin/jlpt.model.js";
import { ApiError } from "../../utils/http.js";
import {
  type BodyInput,
  isOneOf,
  parseAdminPagination,
  parseSortOrder,
  type QueryInput,
  requireString,
  toNumberOrNull,
} from "../../validators/admin/common.validator.js";
import { parseJlptSectionsPayload } from "../../validators/admin/jlpt.validator.js";

class AdminJlptExamService {
  async listJlptExams(query: QueryInput, ownerId?: number) {
    const { limit, offset } = parseAdminPagination(query);
    const params = {
      limit,
      offset,
      search: String(query.search || ""),
      sortOrder: parseSortOrder(query.sort_order),
      ownerId,
    };
    const [data, totalCount] = await Promise.all([
      adminJlptModel.listJlptExams(params),
      adminJlptModel.countJlptExams(params),
    ]);

    return { data, totalCount };
  }

  async createJlptExam(body: BodyInput, userId: number) {
    const title = requireString(body.title);
    const jlptLevel = body.jlpt_level as JlptLevel;
    const sections = parseJlptSectionsPayload(body);

    if (!title || !isOneOf(jlptLevel, JLPT_LEVELS)) {
      throw new ApiError(400, "title and valid jlpt_level are required");
    }

    if (!sections.length) {
      throw new ApiError(400, "At least one JLPT section is required");
    }

    const duplicatedSections = sections.some((section, index) =>
      sections.findIndex((item) => item.section_type === section.section_type) !== index
    );
    if (duplicatedSections) {
      throw new ApiError(400, "JLPT sections must be unique");
    }

    return adminJlptModel.createJlptExam({
      title,
      jlpt_level: jlptLevel,
      year: toNumberOrNull(body.year),
      duration_minutes: toNumberOrNull(body.duration_minutes),
      created_by: userId,
      sections,
    });
  }

  async updateJlptExam(examId: number, body: BodyInput, ownerId?: number) {
    if (body.jlpt_level !== undefined && !isOneOf(body.jlpt_level, JLPT_LEVELS)) {
      throw new ApiError(400, "valid jlpt_level is required");
    }

    const data = await adminJlptModel.updateJlptExam(
      examId,
      {
        title: body.title === undefined ? undefined : requireString(body.title),
        jlpt_level: body.jlpt_level,
        year: body.year === undefined ? undefined : toNumberOrNull(body.year),
        duration_minutes: body.duration_minutes === undefined ? undefined : toNumberOrNull(body.duration_minutes),
      },
      ownerId
    );

    if (!data) {
      throw new ApiError(404, "JLPT test not found or no changes provided");
    }

    return data;
  }

  async deleteJlptExam(examId: number, ownerId?: number) {
    const deleted = await adminJlptModel.deleteJlptExam(examId, ownerId);
    if (!deleted) {
      throw new ApiError(404, "JLPT test not found");
    }
  }
}

export default new AdminJlptExamService();
