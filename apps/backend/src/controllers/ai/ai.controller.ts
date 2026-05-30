import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import aiService, { FlashcardAiMode } from "../../services/ai/ai.service.js";
import { ApiError, ok, requireUser } from "../../utils/http.js";

const flashcardModes: FlashcardAiMode[] = ["paragraph", "dialogue", "explain", "ask"];

const isFlashcardMode = (value: unknown): value is FlashcardAiMode =>
  typeof value === "string" && flashcardModes.includes(value as FlashcardAiMode);

const trimString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const toOptionalString = (value: unknown) => {
  const trimmed = trimString(value);
  return trimmed || null;
};

const toOptionalStringArray = (value: unknown) => {
  if (!Array.isArray(value)) return null;
  return value.map((item) => trimString(item)).filter(Boolean).slice(0, 20);
};

export class AiController {
  async askFlashcard(req: AuthenticatedRequest, res: Response) {
    requireUser(req);

    const mode = req.body.mode;
    const word = trimString(req.body.word);
    if (!isFlashcardMode(mode)) {
      throw new ApiError(400, "Invalid flashcard AI mode");
    }

    if (!word) {
      throw new ApiError(400, "word is required");
    }

    if (mode === "ask" && !trimString(req.body.question)) {
      throw new ApiError(400, "question is required for ask mode");
    }

    const result = await aiService.generateFlashcardResponse({
      mode,
      word,
      meaning: toOptionalString(req.body.meaning),
      reading: toOptionalString(req.body.reading),
      exampleSentence: toOptionalString(req.body.exampleSentence),
      selectedWords: toOptionalStringArray(req.body.selectedWords),
      question: toOptionalString(req.body.question),
    });

    return ok(res, result);
  }
}

export default new AiController();
