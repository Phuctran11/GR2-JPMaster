export type FlashcardAiMode = "paragraph" | "dialogue" | "explain" | "ask";

export interface FlashcardAiPayload {
  mode: FlashcardAiMode;
  word: string;
  meaning?: string | null;
  reading?: string | null;
  exampleSentence?: string | null;
  selectedWords?: string[] | null;
  question?: string | null;
}

export interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}
