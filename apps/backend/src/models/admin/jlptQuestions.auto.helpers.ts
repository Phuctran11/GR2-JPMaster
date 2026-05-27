import type { AutoJlptSectionQuestionsInput, SectionType } from "../admin.model.js";
import type { AutoJlptDifficulty, RequestedJlptDifficultyCount } from "./jlptQuestions.auto.types.js";

const AUTO_JLPT_DIFFICULTIES: AutoJlptDifficulty[] = ["easy", "medium", "hard", "expert"];

export const buildRequestedDifficultyCounts = (
  input: AutoJlptSectionQuestionsInput
): RequestedJlptDifficultyCount[] =>
  AUTO_JLPT_DIFFICULTIES
    .map((difficulty) => ({
      difficulty,
      count: Math.max(0, Math.floor(Number(input.difficulty_counts[difficulty]) || 0)),
    }))
    .filter((item) => item.count > 0);

export const countRequestedQuestions = (requested: RequestedJlptDifficultyCount[]) =>
  requested.reduce((total, item) => total + item.count, 0);

export const isAutoSupportedJlptSection = (sectionType: SectionType) =>
  sectionType === "vocabulary" || sectionType === "grammar";
