import { buildFlashcardPrompt } from "./aiPrompts.service.js";
import type { FlashcardAiMode, FlashcardAiPayload } from "./ai.types.js";
import geminiClientService from "./geminiClient.service.js";

export type { FlashcardAiMode, FlashcardAiPayload };

export class AiService {
  async generateText(prompt: string) {
    return geminiClientService.generateText(prompt);
  }

  async generateFlashcardResponse(payload: FlashcardAiPayload) {
    return this.generateText(buildFlashcardPrompt(payload));
  }
}

export default new AiService();
