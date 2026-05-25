import { useCallback, useEffect, useState } from 'react';

export function useLessonAiAssistant({ lessonId }: { lessonId?: string }) {
  const [aiSelectedText, setAiSelectedText] = useState<string | null>(null);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);

  const handleAskAIAboutSelection = useCallback((selectedText: string) => {
    setAiSelectedText(selectedText.trim() || null);
    setIsAiAssistantOpen(true);
  }, []);

  const openAiAssistantWithoutSelection = useCallback(() => {
    setAiSelectedText(null);
    window.getSelection()?.removeAllRanges();
    setIsAiAssistantOpen(true);
  }, []);

  const closeAiAssistant = useCallback(() => {
    setIsAiAssistantOpen(false);
  }, []);

  useEffect(() => {
    window.addEventListener('jpmaster:open-lesson-ai', openAiAssistantWithoutSelection);
    return () => window.removeEventListener('jpmaster:open-lesson-ai', openAiAssistantWithoutSelection);
  }, [openAiAssistantWithoutSelection]);

  useEffect(() => {
    setAiSelectedText(null);
    setIsAiAssistantOpen(false);
    window.getSelection()?.removeAllRanges();
  }, [lessonId]);

  return {
    aiSelectedText,
    isAiAssistantOpen,
    handleAskAIAboutSelection,
    closeAiAssistant,
  };
}
