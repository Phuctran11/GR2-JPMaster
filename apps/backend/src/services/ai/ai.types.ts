export type AiContextType = "flashcard" | "lesson";

export type FlashcardAiMode = "paragraph" | "dialogue" | "explain" | "ask";
export type LessonAiMode = "explain" | "grammar" | "summary" | "ask";

export interface FlashcardAiPayload {
  mode: FlashcardAiMode;
  word: string;
  meaning?: string | null;
  reading?: string | null;
  exampleSentence?: string | null;
  selectedWords?: string[] | null;
  question?: string | null;
}

export interface LessonAiPayload {
  mode: LessonAiMode;
  lessonTitle: string;
  lessonContent?: string | null;
  selectedText?: string | null;
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
