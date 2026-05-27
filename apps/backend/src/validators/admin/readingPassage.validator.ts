import type { AdminReadingPassageInput } from "../../models/admin.model.js";
import { JLPT_LEVELS } from "../../constants/admin.constants.js";
import { BodyInput, isOneOf, optionalStringOrNull, toNumberOrNull } from "./common.validator.js";

export const parseReadingPassagePayload = (body: BodyInput): AdminReadingPassageInput | { error: string } => {
  if (!isOneOf(body.jlpt_level, JLPT_LEVELS)) return { error: "valid jlpt_level is required" };
  const passageText = optionalStringOrNull(body.passage_text);
  const imageUrl = optionalStringOrNull(body.image_url);
  const imageAssetId = toNumberOrNull(body.image_asset_id);

  if (!passageText && !imageUrl && !imageAssetId) {
    return { error: "passage_text or image is required" };
  }

  return {
    title: optionalStringOrNull(body.title),
    jlpt_level: body.jlpt_level,
    passage_text: passageText,
    image_asset_id: imageAssetId,
    image_url: imageUrl,
  };
};
