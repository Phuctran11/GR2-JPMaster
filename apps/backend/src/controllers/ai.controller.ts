import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import aiService, { FlashcardAiMode, LessonAiMode } from "../services/ai.service.js";

const flashcardModes: FlashcardAiMode[] = ["paragraph", "dialogue", "explain", "ask"];
const lessonModes: LessonAiMode[] = ["explain", "grammar", "summary", "ask"];

const isFlashcardMode = (value: unknown): value is FlashcardAiMode =>
  typeof value === "string" && flashcardModes.includes(value as FlashcardAiMode);

const isLessonMode = (value: unknown): value is LessonAiMode =>
  typeof value === "string" && lessonModes.includes(value as LessonAiMode);

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
  async askFlashcard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: "User not authenticated" });

      const mode = req.body.mode;
      const word = trimString(req.body.word);
      if (!isFlashcardMode(mode)) {
        return res.status(400).json({ error: "Invalid flashcard AI mode" });
      }

      if (!word) {
        return res.status(400).json({ error: "word is required" });
      }

      if (mode === "ask" && !trimString(req.body.question)) {
        return res.status(400).json({ error: "question is required for ask mode" });
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

      return res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async askLesson(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: "User not authenticated" });

      const mode = req.body.mode;
      const lessonTitle = trimString(req.body.lessonTitle);
      if (!isLessonMode(mode)) {
        return res.status(400).json({ error: "Invalid lesson AI mode" });
      }

      if (!lessonTitle) {
        return res.status(400).json({ error: "lessonTitle is required" });
      }

      if (mode === "ask" && !trimString(req.body.question)) {
        return res.status(400).json({ error: "question is required for ask mode" });
      }

      const result = await aiService.generateLessonResponse({
        mode,
        lessonTitle,
        lessonContent: toOptionalString(req.body.lessonContent),
        selectedText: toOptionalString(req.body.selectedText),
        question: toOptionalString(req.body.question),
      });

      return res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }
}

export default new AiController();
