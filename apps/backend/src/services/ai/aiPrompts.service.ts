import type { AiContextType, FlashcardAiMode, FlashcardAiPayload, LessonAiMode, LessonAiPayload } from "./ai.types.js";

const compactText = (value: string, maxLength: number) => {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
};

const buildSystemInstruction = (contextType: AiContextType) => {
  const baseRules = [
    "You are a Japanese learning assistant.",
    "Answer in clear, concise English.",
    "When you include Japanese examples, add romaji or reading when useful and provide an English translation.",
    "Do not invent unnecessary information. If context is limited, say so and give the most likely interpretation.",
  ];

  if (contextType === "flashcard") {
    return [
      ...baseRules,
      "The context is a vocabulary flashcard. Prioritize meaning, usage, natural examples, nuance, and common mistakes.",
    ].join("\n");
  }

  return [
    ...baseRules,
    "The context is lesson content. Prioritize explaining the content, grammar, sentence patterns, and how to apply them.",
  ].join("\n");
};

export const buildFlashcardPrompt = (payload: FlashcardAiPayload) => {
  const selectedWords = payload.selectedWords?.filter(Boolean).join(", ") || "none";
  const question = payload.question?.trim() || "none";

  const taskByMode: Record<FlashcardAiMode, string> = {
    paragraph: "Create a short 4-6 sentence passage that uses the current word naturally.",
    dialogue: "Create a short 6-8 turn dialogue that uses the current word naturally.",
    explain: "Explain the current word: meaning, usage, nuance, examples, and common mistakes.",
    ask: "Answer the learner's question based on the current flashcard.",
  };

  return `${buildSystemInstruction("flashcard")}

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

export const buildLessonPrompt = (payload: LessonAiPayload) => {
  const lessonContent = compactText(payload.lessonContent || "", 7000) || "no lesson content";
  const selectedText = payload.selectedText?.trim() || "none";
  const question = payload.question?.trim() || "none";

  const taskByMode: Record<LessonAiMode, string> = {
    explain: "Explain the lesson content in a clear and beginner-friendly way.",
    grammar: "Explain the grammar or sentence structure in the selected text, or in the lesson if no text is selected.",
    summary: "Summarize the lesson into key points and important takeaways.",
    ask: "Answer the learner's question based on the lesson content.",
  };

  return `${buildSystemInstruction("lesson")}

Task: ${taskByMode[payload.mode]}

Lesson:
- Title: ${payload.lessonTitle}
- Selected text: ${selectedText}
- Learner question: ${question}
- Lesson content: ${lessonContent}

Response format:
- Start with a direct answer.
- For grammar, include pattern, usage, Japanese examples, and English translation.
- For summaries, include only the most important points.`;
};
