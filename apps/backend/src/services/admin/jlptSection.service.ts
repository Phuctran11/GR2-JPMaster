import { SECTION_TYPES } from "../../constants/admin.constants.js";
import type { SectionType } from "../../models/admin.model.js";
import adminJlptModel from "../../models/admin/jlpt.model.js";
import { ApiError } from "../../utils/http.js";
import {
  type BodyInput,
  isOneOf,
  optionalFiniteNumber,
  optionalStringOrNull,
  requireFiniteNumber,
  requireString,
  toNumberOrNull,
} from "../../validators/admin/common.validator.js";
import { defaultJlptSectionTitle } from "../../validators/admin/jlpt.validator.js";

class AdminJlptSectionService {
  async listJlptSections(examId: number, ownerId?: number) {
    return adminJlptModel.listJlptSections(examId, ownerId);
  }

  async createJlptSection(examId: number, body: BodyInput, ownerId?: number) {
    if (!isOneOf(body.section_type, SECTION_TYPES)) {
      throw new ApiError(400, "valid section_type is required");
    }

    const sectionType = body.section_type as SectionType;
    const data = await adminJlptModel.createJlptSection(
      examId,
      {
        title: requireString(body.title) || defaultJlptSectionTitle(sectionType),
        section_type: sectionType,
        section_order: requireFiniteNumber(body.section_order ?? 1, "section_order"),
        duration_minutes: toNumberOrNull(body.duration_minutes),
        audio_asset_id: sectionType === "listening" ? toNumberOrNull(body.audio_asset_id) : null,
        audio_url: sectionType === "listening" ? optionalStringOrNull(body.audio_url) : null,
      },
      ownerId
    );

    if (!data) {
      throw new ApiError(404, "JLPT test not found");
    }

    return data;
  }

  async updateJlptSection(sectionId: number, body: BodyInput, ownerId?: number) {
    if (body.section_type !== undefined && !isOneOf(body.section_type, SECTION_TYPES)) {
      throw new ApiError(400, "valid section_type is required");
    }

    const sectionType = body.section_type as SectionType | undefined;
    const data = await adminJlptModel.updateJlptSection(
      sectionId,
      {
        title: body.title === undefined ? undefined : requireString(body.title),
        section_type: sectionType,
        section_order: optionalFiniteNumber(body.section_order, "section_order"),
        duration_minutes: body.duration_minutes === undefined ? undefined : toNumberOrNull(body.duration_minutes),
        audio_asset_id:
          body.audio_asset_id === undefined
            ? undefined
            : sectionType === "listening"
              ? toNumberOrNull(body.audio_asset_id)
              : null,
        audio_url:
          body.audio_url === undefined
            ? undefined
            : sectionType === "listening"
              ? optionalStringOrNull(body.audio_url)
              : null,
      },
      ownerId
    );

    if (!data) {
      throw new ApiError(404, "JLPT section not found or no changes provided");
    }

    return data;
  }

  async deleteJlptSection(sectionId: number, ownerId?: number) {
    const deleted = await adminJlptModel.deleteJlptSection(sectionId, ownerId);
    if (!deleted) {
      throw new ApiError(404, "JLPT section not found");
    }
  }
}

export default new AdminJlptSectionService();
