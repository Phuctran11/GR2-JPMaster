import { useEffect, useState } from 'react';

export const OPEN_FLASHCARD_AI_EVENT = 'jpmaster:open-flashcard-ai';

export function useFlashcardAiAssistant() {
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);

  const openAiAssistant = () => setIsAiAssistantOpen(true);
  const closeAiAssistant = () => setIsAiAssistantOpen(false);

  useEffect(() => {
    window.addEventListener(OPEN_FLASHCARD_AI_EVENT, openAiAssistant);
    return () => window.removeEventListener(OPEN_FLASHCARD_AI_EVENT, openAiAssistant);
  }, []);

  return {
    isAiAssistantOpen,
    openAiAssistant,
    closeAiAssistant,
  };
}
