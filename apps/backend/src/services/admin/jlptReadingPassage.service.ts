import { JLPT_LEVELS } from "../../constants/admin.constants.js";
import adminJlptModel from "../../models/admin/jlpt.model.js";
import { ApiError } from "../../utils/http.js";
import { type BodyInput, isOneOf, type QueryInput } from "../../validators/admin/common.validator.js";
import { parseReadingPassagePayload } from "../../validators/admin/readingPassage.validator.js";

class AdminJlptReadingPassageService {
  async listReadingPassages(query: QueryInput, ownerId?: number) {
    const jlptLevel = isOneOf(query.jlpt_level, JLPT_LEVELS) ? query.jlpt_level : undefined;
    return adminJlptModel.listReadingPassages({ jlptLevel, ownerId });
  }

  async createReadingPassage(body: BodyInput, userId: number) {
    const parsed = parseReadingPassagePayload(body);
    if ("error" in parsed) {
      throw new ApiError(400, parsed.error);
    }

    return adminJlptModel.createReadingPassage({
      ...parsed,
      created_by: userId,
    });
  }

  async updateReadingPassage(passageId: number, body: BodyInput, ownerId?: number) {
    const parsed = parseReadingPassagePayload(body);
    if ("error" in parsed) {
      throw new ApiError(400, parsed.error);
    }

    const data = await adminJlptModel.updateReadingPassage(passageId, parsed, ownerId);
    if (!data) {
      throw new ApiError(404, "Reading passage not found");
    }

    return data;
  }

  async deleteReadingPassage(passageId: number, ownerId?: number) {
    const deleted = await adminJlptModel.deleteReadingPassage(passageId, ownerId);
    if (!deleted) {
      throw new ApiError(404, "Reading passage not found");
    }
  }
}

export default new AdminJlptReadingPassageService();
