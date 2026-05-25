import type { AdminJlptSectionInput, AutoJlptSectionQuestionsInput, SectionType } from "../../models/admin.model.js";
import { JLPT_LEVELS, QUESTION_DIFFICULTIES, SECTION_TYPES } from "../../constants/admin.constants.js";
import { BodyInput, isOneOf, optionalStringOrNull, requireString, toNumberOrNull } from "./common.validator.js";

export const defaultJlptSectionTitle = (sectionType: SectionType) =>
  ({
    vocabulary: "Vocabulary",
    grammar: "Grammar",
    reading: "Reading",
    listening: "Listening",
  })[sectionType];

type SectionInput = Record<string, unknown>;

export const parseJlptSectionsPayload = (body: BodyInput): AdminJlptSectionInput[] => {
  const sections = Array.isArray(body.sections) ? body.sections : [];
  return sections
    .map((section: SectionInput, index: number) => {
      const sectionType = section.section_type;
      if (!isOneOf(sectionType, SECTION_TYPES)) return null;
      return {
        title: requireString(section.title) || defaultJlptSectionTitle(sectionType),
        section_type: sectionType,
        section_order: Number(section.section_order ?? index + 1),
        duration_minutes: toNumberOrNull(section.duration_minutes),
        audio_asset_id: sectionType === "listening" ? toNumberOrNull(section.audio_asset_id) : null,
        audio_url: sectionType === "listening" ? optionalStringOrNull(section.audio_url) : null,
      };
    })
    .filter(Boolean) as AdminJlptSectionInput[];
};

export const parseAutoJlptQuestionsPayload = (body: BodyInput): AutoJlptSectionQuestionsInput | { error: string } => {
  const counts = body.difficulty_counts && typeof body.difficulty_counts === "object"
    ? body.difficulty_counts as Record<string, unknown>
    : body;
  const difficulty_counts: AutoJlptSectionQuestionsInput["difficulty_counts"] = {};
  let total = 0;

  for (const difficulty of QUESTION_DIFFICULTIES) {
    const value = Number(counts[difficulty] ?? 0);
    if (!Number.isFinite(value) || value < 0) return { error: "difficulty counts must be non-negative numbers" };
    const count = Math.floor(value);
    if (count > 0) {
      difficulty_counts[difficulty as keyof AutoJlptSectionQuestionsInput["difficulty_counts"]] = count;
      total += count;
    }
  }

  if (total <= 0) return { error: "At least one difficulty count is required" };
  if (body.jlpt_level !== undefined && !isOneOf(body.jlpt_level, JLPT_LEVELS)) return { error: "valid jlpt_level is required" };

  return {
    jlpt_level: body.jlpt_level,
    difficulty_counts,
  };
};
