import type { AdminQuizQuestionInput, QuestionType } from "../../models/admin.model.js";
import { JLPT_LEVELS, QUESTION_DIFFICULTIES, QUESTION_TYPES, SECTION_TYPES } from "../../constants/admin.constants.js";
import { BodyInput, isOneOf, optionalStringOrNull, requireString, toNumberOrNull } from "./common.validator.js";

type ParseQuestionResult = { data: AdminQuizQuestionInput } | { error: string };
type OptionInput = Record<string, unknown>;

export const parseQuestionPayload = (body: BodyInput): ParseQuestionResult => {
  const questionText = requireString(body.question_text);
  const questionType = body.question_type as QuestionType;
  const points = Number(body.points ?? 1);
  const marks = Number(body.marks ?? points);
  const orderIndex = toNumberOrNull(body.order_index);
  const options = Array.isArray(body.options) ? body.options : [];

  if (!questionText || !QUESTION_TYPES.includes(questionType) || !Number.isFinite(points) || !Number.isFinite(marks)) {
    return { error: "question_text, valid question_type, points, and marks are required" };
  }

  if (!isOneOf(body.difficulty_level, QUESTION_DIFFICULTIES)) return { error: "valid difficulty_level is required" };
  if (!isOneOf(body.jlpt_level, JLPT_LEVELS)) return { error: "valid jlpt_level is required" };
  if (!isOneOf(body.section_type, SECTION_TYPES)) return { error: "valid section_type is required" };

  const imageAssetId = toNumberOrNull(body.image_asset_id);
  const imageUrl = optionalStringOrNull(body.image_url);
  const audioAssetId = toNumberOrNull(body.audio_asset_id);
  const audioUrl = optionalStringOrNull(body.audio_url);
  const readingPassageId = toNumberOrNull(body.reading_passage_id);

  if ((audioAssetId || audioUrl) && body.section_type !== "listening") {
    return { error: "audio can only be attached to listening questions" };
  }

  const normalizedOptions = options
    .map((option: OptionInput) => ({
      option_id: toNumberOrNull(option.option_id) ?? undefined,
      option_text: requireString(option.option_text),
      is_correct: Boolean(option.is_correct),
      explanation: optionalStringOrNull(option.explanation),
    }))
    .filter((option: { option_text: string }) => option.option_text);

  if (questionType !== "fill_in_blank" && normalizedOptions.length < 2) {
    return { error: "At least two options are required" };
  }

  if (!normalizedOptions.some((option: { is_correct: boolean }) => option.is_correct)) {
    return { error: "At least one correct option is required" };
  }

  if (questionType === "single_choice" || questionType === "true_false") {
    const correctCount = normalizedOptions.filter((option: { is_correct: boolean }) => option.is_correct).length;
    if (correctCount !== 1) return { error: "Single choice and true/false questions require exactly one correct option" };
  }

  return {
    data: {
      question_text: questionText,
      question_type: questionType,
      difficulty_level: body.difficulty_level,
      explanation: optionalStringOrNull(body.explanation),
      points,
      jlpt_level: body.jlpt_level,
      section_type: body.section_type,
      reading_passage_id: body.section_type === "reading" ? readingPassageId : null,
      image_asset_id: imageAssetId,
      image_url: imageUrl,
      audio_asset_id: body.section_type === "listening" ? audioAssetId : null,
      audio_url: body.section_type === "listening" ? audioUrl : null,
      order_index: orderIndex,
      marks,
      options: normalizedOptions,
    },
  };
};
