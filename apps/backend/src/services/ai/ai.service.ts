import { buildFlashcardPrompt, buildLessonPrompt } from "./aiPrompts.service.js";
import type { FlashcardAiMode, FlashcardAiPayload, LessonAiMode, LessonAiPayload } from "./ai.types.js";
import geminiClientService from "./geminiClient.service.js";

export type { FlashcardAiMode, FlashcardAiPayload, LessonAiMode, LessonAiPayload };

export class AiService {
  async generateText(prompt: string) {
    return geminiClientService.generateText(prompt);
  }

  async generateFlashcardResponse(payload: FlashcardAiPayload) {
    return this.generateText(buildFlashcardPrompt(payload));
  }

  async generateLessonResponse(payload: LessonAiPayload) {
    return this.generateText(buildLessonPrompt(payload));
  }
}

export default new AiService();
