import { AIAssistantPanel } from '../ai/AIAssistantPanel';
import type { Lesson as LessonData } from '../../services/api';

export function LessonAiAssistantModal({
  lesson,
  selectedText,
  onClose,
  onSaveAnswer,
}: {
  lesson: LessonData;
  selectedText: string | null;
  onClose: () => void;
  onSaveAnswer: (answer: string) => Promise<void>;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/45 p-3 sm:p-5" role="dialog" aria-modal="true">
      <div className="flex h-full w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant px-5 py-4">
          <div className="min-w-0">
            <p className="text-label-md font-bold uppercase tracking-wide text-primary">Lesson AI</p>
            <h2 className="truncate text-title-lg font-bold text-on-surface">{lesson.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container"
            aria-label="Close AI assistant"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto bg-surface-container-low p-4 sm:p-5">
          <AIAssistantPanel
            title="Ask AI about this lesson"
            description="Ask for explanations, grammar notes, summaries, or clarification about selected lesson text."
            className="shadow-none"
            onSaveAnswer={onSaveAnswer}
            saveAnswerLabel="Save AI Note"
            context={{
              type: 'lesson',
              lessonTitle: lesson.title,
              lessonContent: lesson.content_text,
              selectedText,
            }}
          />
        </div>
      </div>
    </div>
  );
}
