import type { AutoJlptSectionQuestionsInput, JlptLevel, SectionType } from "../admin.model.js";

export type AutoJlptDifficulty = keyof AutoJlptSectionQuestionsInput["difficulty_counts"];

export interface RequestedJlptDifficultyCount {
  difficulty: AutoJlptDifficulty;
  count: number;
}

export interface AutoJlptSectionContext {
  section_type: SectionType;
  jlpt_level: JlptLevel;
}

export interface AutoJlptQuestionShortage {
  difficulty: AutoJlptDifficulty;
  requested: number;
  available: number;
}
