import { useState, type RefObject } from 'react';
import type { Lesson as LessonData, LessonNote } from '../../services/api';
import { Heading, Text } from '../ui/Typography';

interface LessonContentProps {
  lesson: LessonData;
  isStudyMode: boolean;
  articleRef: RefObject<HTMLElement | null>;
  onAddHighlightNote?: (selectedText: string) => void;
  onSaveFlashcard?: (selectedText: string) => Promise<void> | void;
  onAskAIAboutSelection?: (selectedText: string) => void;
  highlightNotes?: LessonNote[];
}

type LessonContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'ordered-list' | 'unordered-list'; items: string[] };

const normalizeLessonContent = (value?: string | null) => {
  return (value ?? '')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n?/g, '\n')
    .trim();
};

const parseLessonContent = (content: string): LessonContentBlock[] => {
  const blocks: LessonContentBlock[] = [];
  const lines = content.split('\n');
  let paragraphLines: string[] = [];
  let listType: 'ordered-list' | 'unordered-list' | null = null;
  let listItems: string[] = [];

  const flushParagraph = () => {
    const text = paragraphLines.join('\n').trim();
    if (text) blocks.push({ type: 'paragraph', text });
    paragraphLines = [];
  };

  const flushList = () => {
    if (listType && listItems.length > 0) {
      blocks.push({ type: listType, items: listItems });
    }
    listType = null;
    listItems = [];
  };

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    const orderedMatch = trimmedLine.match(/^\d+[.)]\s+(.+)$/);
    const unorderedMatch = trimmedLine.match(/^[-*•]\s+(.+)$/);

    if (!trimmedLine) {
      flushParagraph();
      flushList();
      return;
    }

    if (orderedMatch) {
      flushParagraph();
      if (listType !== 'ordered-list') {
        flushList();
        listType = 'ordered-list';
      }
      listItems.push(orderedMatch[1].trim());
      return;
    }

    if (unorderedMatch) {
      flushParagraph();
      if (listType !== 'unordered-list') {
        flushList();
        listType = 'unordered-list';
      }
      listItems.push(unorderedMatch[1].trim());
      return;
    }

    flushList();
    paragraphLines.push(line);
  });

  flushParagraph();
  flushList();

  return blocks;
};

const renderHighlightedText = (text: string, highlightedTexts: string[]) => {
  const validHighlights = highlightedTexts
    .map((value) => value.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  if (validHighlights.length === 0) return text;

  const parts: Array<{ text: string; highlighted: boolean }> = [];
  let cursor = 0;

  while (cursor < text.length) {
    let nextIndex = -1;
    let nextHighlight = '';

    for (const highlight of validHighlights) {
      const index = text.indexOf(highlight, cursor);
      if (index >= 0 && (nextIndex === -1 || index < nextIndex || (index === nextIndex && highlight.length > nextHighlight.length))) {
        nextIndex = index;
        nextHighlight = highlight;
      }
    }

    if (nextIndex === -1) {
      parts.push({ text: text.slice(cursor), highlighted: false });
      break;
    }

    if (nextIndex > cursor) {
      parts.push({ text: text.slice(cursor, nextIndex), highlighted: false });
    }

    parts.push({ text: text.slice(nextIndex, nextIndex + nextHighlight.length), highlighted: true });
    cursor = nextIndex + nextHighlight.length;
  }

  return parts.map((part, index) =>
    part.highlighted ? (
      <mark
        key={index}
        className="rounded px-1 py-0.5 font-semibold"
        style={{ backgroundColor: '#fde047', color: '#713f12', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' }}
      >
        {part.text}
      </mark>
    ) : (
      <span key={index}>{part.text}</span>
    )
  );
};

export function LessonContent({
  lesson,
  isStudyMode,
  articleRef,
  onAddHighlightNote,
  onSaveFlashcard,
  onAskAIAboutSelection,
  highlightNotes = [],
}: LessonContentProps) {
  const contentText = normalizeLessonContent(lesson.content_text);
  const contentBlocks = contentText ? parseLessonContent(contentText) : [];
  const [selectionMenu, setSelectionMenu] = useState<{ text: string; x: number; y: number } | null>(null);
  const [savingFlashcard, setSavingFlashcard] = useState(false);
  const highlightedTexts = highlightNotes.map((note) => note.selected_text ?? '').filter(Boolean);

  const clearSelection = () => {
    window.getSelection()?.removeAllRanges();
    setSelectionMenu(null);
  };

  const handleTextAction = async (action: 'note' | 'flashcard' | 'ai') => {
    const selectedText = selectionMenu?.text || window.getSelection()?.toString().trim();
    if (!selectedText) return;

    if (action === 'note') {
      onAddHighlightNote?.(selectedText);
      clearSelection();
      return;
    }

    if (action === 'ai') {
      onAskAIAboutSelection?.(selectedText);
      clearSelection();
      return;
    }

    if (!onSaveFlashcard || savingFlashcard) return;
    try {
      setSavingFlashcard(true);
      await onSaveFlashcard(selectedText);
      clearSelection();
    } finally {
      setSavingFlashcard(false);
    }
  };

  const handleSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    if (!selection || !selectedText || selection.rangeCount === 0) {
      setSelectionMenu(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const container = articleRef.current;
    if (!container || !container.contains(range.commonAncestorContainer)) {
      setSelectionMenu(null);
      return;
    }

    const rect = range.getBoundingClientRect();
    setSelectionMenu({
      text: selectedText,
      x: rect.left + rect.width / 2,
      y: Math.max(12, rect.top - 12),
    });
  };

  return (
    <article
      ref={articleRef}
      onMouseUp={handleSelection}
      onKeyUp={handleSelection}
      className={`overflow-hidden rounded-xl border bg-surface-container-lowest shadow-sm transition-all duration-300 ${
        isStudyMode ? 'border-primary shadow-lg shadow-primary/10 ring-2 ring-primary/20' : 'border-outline-variant'
      }`}
    >
      <header className="border-b border-outline-variant bg-surface px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="mb-2 text-label-md font-label-md uppercase text-secondary">Focus lesson</p>
            <Heading level="h2" size="headline-md" className="text-on-surface">
              {lesson.title}
            </Heading>
            <Text variant="body-md" color="on-surface-variant" className="mt-2 max-w-[680px]">
              {lesson.video_url?.trim()
                ? 'Watch the lesson first, then use the notes below to lock in the main ideas.'
                : 'Read carefully through the lesson notes and mark the lesson complete when you are ready.'}
            </Text>
          </div>
        </div>
      </header>

      <section className="px-5 py-6 sm:px-7 sm:py-8">
        <div className="mb-5 flex items-center gap-3 border-b border-outline-variant pb-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary">
            <span className="material-symbols-outlined text-[22px]">article</span>
          </span>
          <div>
            <h3 className="text-headline-sm font-headline-sm text-on-surface">Lesson Content</h3>
            <p className="text-body-md font-body-md text-on-surface-variant">Read at your own pace.</p>
          </div>
        </div>

        {lesson.audio_url && (
          <div className="mb-6">
            <audio controls src={lesson.audio_url} className="w-full">
              <track kind="captions" />
            </audio>
          </div>
        )}

        <div className="space-y-5 text-on-surface">
          {contentBlocks.length > 0 ? (
            contentBlocks.map((block, index) => {
              if (block.type === 'ordered-list') {
                return (
                  <ol key={index} className="list-decimal space-y-2 pl-6 text-body-lg font-body-lg leading-8 text-on-surface">
                    {block.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="pl-1">
                        {renderHighlightedText(item, highlightedTexts)}
                      </li>
                    ))}
                  </ol>
                );
              }

              if (block.type === 'unordered-list') {
                return (
                  <ul key={index} className="list-disc space-y-2 pl-6 text-body-lg font-body-lg leading-8 text-on-surface">
                    {block.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="pl-1">
                        {renderHighlightedText(item, highlightedTexts)}
                      </li>
                    ))}
                  </ul>
                );
              }

              if (block.type === 'paragraph') {
                return (
                  <p key={index} className="whitespace-pre-line text-body-lg font-body-lg leading-8 text-on-surface">
                    {renderHighlightedText(block.text, highlightedTexts)}
                  </p>
                );
              }

              return null;
            })
          ) : (
            <div className="rounded-lg border border-dashed border-outline-variant bg-surface-container-low px-4 py-5 text-on-surface-variant">
              This lesson does not have text content yet.
            </div>
          )}
        </div>

        {selectionMenu && (
          <div
            className="fixed z-[95] flex -translate-x-1/2 -translate-y-full gap-1 rounded-xl border border-outline-variant bg-surface p-1.5 shadow-xl"
            style={{ left: selectionMenu.x, top: selectionMenu.y }}
          >
            <button type="button" onClick={() => void handleTextAction('note')} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-label-md font-bold text-on-primary">
              <span className="material-symbols-outlined text-[18px]">add_notes</span>
              Add Note
            </button>
            <button
              type="button"
              onClick={() => void handleTextAction('flashcard')}
              disabled={savingFlashcard}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-label-md font-bold text-on-surface-variant hover:bg-surface-container disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[18px]">style</span>
              {savingFlashcard ? 'Saving...' : 'Save Flashcard'}
            </button>
            <button type="button" onClick={() => void handleTextAction('ai')} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-label-md font-bold text-on-surface-variant hover:bg-surface-container">
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              Ask AI
            </button>
          </div>
        )}
      </section>
    </article>
  );
}
