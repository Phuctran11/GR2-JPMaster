import { useState } from 'react';
import { Button, Card, Icon } from '../index';
import { aiAPI, type FlashcardAiMode, type LessonAiMode } from '../../services/api';
import { useToastMessages } from '../../hooks/useToastMessages';

type FlashcardContext = {
  type: 'flashcard';
  word: string;
  meaning?: string | null;
  reading?: string | null;
  exampleSentence?: string | null;
  selectedWords?: string[] | null;
};

type LessonContext = {
  type: 'lesson';
  lessonTitle: string;
  lessonContent?: string | null;
  selectedText?: string | null;
};

type AiContext = FlashcardContext | LessonContext;

interface AIAssistantPanelProps {
  title: string;
  description: string;
  context: AiContext;
  className?: string;
  onSaveAnswer?: (answer: string) => Promise<void> | void;
  saveAnswerLabel?: string;
}

const flashcardActions: Array<{ mode: FlashcardAiMode; label: string; icon: string }> = [
  { mode: 'paragraph', label: 'Create Passage', icon: 'article' },
  { mode: 'dialogue', label: 'Create Dialogue', icon: 'forum' },
  { mode: 'explain', label: 'Explain Word', icon: 'school' },
];

const lessonActions: Array<{ mode: LessonAiMode; label: string; icon: string }> = [
  { mode: 'summary', label: 'Summarize Lesson', icon: 'summarize' },
  { mode: 'grammar', label: 'Explain Grammar', icon: 'psychology' },
  { mode: 'explain', label: 'Explain Content', icon: 'school' },
];

const getSelectedTextLabel = (context: AiContext) => {
  if (context.type !== 'lesson' || !context.selectedText?.trim()) return null;
  const text = context.selectedText.trim();
  return text.length > 160 ? `${text.slice(0, 160)}...` : text;
};

const cleanAiText = (value: string) =>
  value
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '- ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

export function AIAssistantPanel({
  title,
  description,
  context,
  className = '',
  onSaveAnswer,
  saveAnswerLabel = 'Save as Note',
}: AIAssistantPanelProps) {
  const toast = useToastMessages();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loadingMode, setLoadingMode] = useState<FlashcardAiMode | LessonAiMode | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const selectedTextLabel = getSelectedTextLabel(context);
  const cleanedAnswer = cleanAiText(answer);

  const askAI = async (mode: FlashcardAiMode | LessonAiMode) => {
    if (loadingMode) return;
    if (mode === 'ask' && !question.trim()) {
      setError('Enter a question before asking AI.');
      return;
    }

    try {
      setLoadingMode(mode);
      setError('');
      setAnswer('');

      const result =
        context.type === 'flashcard'
          ? await aiAPI.askFlashcard({
              mode: mode as FlashcardAiMode,
              word: context.word,
              meaning: context.meaning,
              reading: context.reading,
              exampleSentence: context.exampleSentence,
              selectedWords: context.selectedWords,
              question: question.trim() || null,
            })
          : await aiAPI.askLesson({
              mode: mode as LessonAiMode,
              lessonTitle: context.lessonTitle,
              lessonContent: context.lessonContent,
              selectedText: context.selectedText,
              question: question.trim() || null,
            });

      setAnswer(cleanAiText(result.data.text));
      setCopied(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to reach AI right now.');
    } finally {
      setLoadingMode(null);
    }
  };

  const actions = context.type === 'flashcard' ? flashcardActions : lessonActions;
  const copyAnswer = async () => {
    if (!cleanedAnswer) return;

    try {
      await navigator.clipboard.writeText(cleanedAnswer);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('Unable to copy the answer in this browser.');
    }
  };

  const saveAnswer = async () => {
    if (!cleanedAnswer || !onSaveAnswer || savingAnswer) return;

    try {
      setSavingAnswer(true);
      setError('');
      await onSaveAnswer(cleanedAnswer);
      toast.success('AI note saved successfully.');
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Unable to save this answer.';
      setError(message);
      toast.error(message);
    } finally {
      setSavingAnswer(false);
    }
  };

  return (
    <Card className={`rounded-xl border border-outline-variant p-stack-lg ${className}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-label-md font-bold uppercase tracking-wide text-secondary">AI Assistant</p>
          <h2 className="mt-1 text-headline-md font-bold text-on-surface">{title}</h2>
          <p className="mt-2 max-w-2xl text-body-md text-on-surface-variant">{description}</p>
        </div>
      </div>

      {selectedTextLabel && (
        <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-label-md font-bold text-primary">Selected Text</p>
          <p className="mt-1 text-body-md text-on-surface">{selectedTextLabel}</p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        {actions.map((action) => (
          <button
            key={action.mode}
            type="button"
            onClick={() => askAI(action.mode)}
            disabled={Boolean(loadingMode)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface px-4 py-3 text-label-md font-bold text-on-surface transition hover:border-primary hover:text-primary disabled:opacity-50"
          >
            <Icon name={action.icon} size="sm" />
            {loadingMode === action.mode ? 'Generating...' : action.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={3}
          className="min-h-[96px] w-full resize-y rounded-lg border border-outline-variant bg-surface px-4 py-3 outline-none focus:border-primary"
          placeholder={context.type === 'flashcard' ? 'Ask AI anything about this word...' : 'Ask AI about the lesson content or grammar...'}
        />
        <Button
          type="button"
          onClick={() => askAI('ask')}
          disabled={Boolean(loadingMode) || !question.trim()}
          className="self-end rounded-lg px-5 py-3"
        >
          {loadingMode === 'ask' ? 'Asking...' : 'Ask AI'}
        </Button>
      </div>

      {error && <p className="mt-4 rounded-lg bg-error-container px-4 py-3 text-body-md text-on-error-container">{error}</p>}

      {answer && (
        <div className="mt-5 rounded-lg border border-outline-variant bg-surface-container-low px-4 py-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-label-md font-bold uppercase tracking-wide text-on-surface-variant">Answer</p>
            <button
              type="button"
              onClick={copyAnswer}
              className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-label-sm font-bold text-on-surface-variant hover:border-primary hover:text-primary"
            >
              <Icon name={copied ? 'check' : 'content_copy'} size="sm" />
              {copied ? 'Copied' : 'Copy'}
            </button>
            {onSaveAnswer && (
              <button
                type="button"
                onClick={saveAnswer}
                disabled={savingAnswer}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-label-sm font-bold text-on-primary disabled:opacity-50"
              >
                <Icon name={savingAnswer ? 'hourglass_empty' : 'save'} size="sm" />
                {savingAnswer ? 'Saving...' : saveAnswerLabel}
              </button>
            )}
          </div>
          <div className="whitespace-pre-line text-body-md leading-7 text-on-surface">{cleanedAnswer}</div>
        </div>
      )}
    </Card>
  );
}
