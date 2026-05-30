import type { FlashcardAiMode, FlashcardAiPayload } from "./ai.types.js";

const buildSystemInstruction = () =>
  [
    "You are a Japanese learning assistant.",
    "Answer in clear, concise English.",
    "When you include Japanese examples, add romaji or reading when useful and provide an English translation.",
    "Do not invent unnecessary information. If context is limited, say so and give the most likely interpretation.",
    "The context is a vocabulary flashcard. Prioritize meaning, usage, natural examples, nuance, and common mistakes.",
  ].join("\n");

export const buildFlashcardPrompt = (payload: FlashcardAiPayload) => {
  const selectedWords = payload.selectedWords?.filter(Boolean).join(", ") || "none";
  const question = payload.question?.trim() || "none";

  const taskByMode: Record<FlashcardAiMode, string> = {
    paragraph: "Create a short 4-6 sentence passage that uses the current word naturally.",
    dialogue: "Create a short 6-8 turn dialogue that uses the current word naturally.",
    explain: "Explain the current word: meaning, usage, nuance, examples, and common mistakes.",
    ask: "Answer the learner's question based on the current flashcard.",
  };

  return `${buildSystemInstruction()}

Task: ${taskByMode[payload.mode]}

Flashcard:
- Front text / word: ${payload.word}
- Back text / meaning: ${payload.meaning || "none"}
- Reading: ${payload.reading || "none"}
- Saved example: ${payload.exampleSentence || "none"}
- Additional selected words: ${selectedWords}
- Learner question: ${question}

Response format:
- For passages/dialogues: show Japanese first, then an English translation, then 2-3 short vocabulary notes.
- For explanations/questions: use concise bullet points and include examples where helpful.`;
};
